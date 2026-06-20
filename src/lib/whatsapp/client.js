// Twilio WhatsApp client, built from a config object (see config.js).
// createWhatsAppClient(config) -> { sendText, sendImage, sendTemplate, markRead, getMediaUrl, downloadMedia }
//
// Twilio is the WhatsApp Business provider here. No SDK needed — just fetch +
// Basic auth with the Account SID / Auth Token.

const API = 'https://api.twilio.com/2010-04-01';

// Accepts "573209937784", "+573209937784", or "whatsapp:+57..." -> "whatsapp:+57..."
function waAddr(num) {
  let s = String(num).trim();
  if (s.startsWith('whatsapp:')) return s;
  if (!s.startsWith('+')) s = '+' + s.replace(/[^\d]/g, '');
  return 'whatsapp:' + s;
}

export function createWhatsAppClient(config) {
  const accountSid = config.accountSid;
  const authToken = config.authToken;
  const from = config.fromNumber;
  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio WhatsApp config missing accountSid, authToken, or fromNumber');
  }
  const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  async function post(params) {
    const res = await fetch(`${API}/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Twilio API ${res.status}: ${JSON.stringify(data)}`);
    return data; // includes { sid, status, ... }
  }

  return {
    // Free-text reply — valid only inside the 24h customer-service window.
    sendText(to, body) {
      return post({ From: waAddr(from), To: waAddr(to), Body: body });
    },
    sendImage(to, link, caption) {
      const p = { From: waAddr(from), To: waAddr(to), MediaUrl: link };
      if (caption) p.Body = caption;
      return post(p);
    },
    // Pre-approved template to RE-OPEN a conversation older than 24h.
    // With Twilio, pass the Content template SID as `contentSid` and optional
    // `variables`; the Meta-style name/languageCode args don't apply here.
    sendTemplate(to, contentSid, _languageCode, variables) {
      const p = { From: waAddr(from), To: waAddr(to), ContentSid: contentSid };
      if (variables) p.ContentVariables = JSON.stringify(variables);
      return post(p);
    },
    // Twilio has no inbound read-receipt REST call; no-op for interface parity.
    markRead() { return Promise.resolve(); },
    // Inbound media arrives as a direct (auth-protected) Twilio URL.
    getMediaUrl(url) { return Promise.resolve(url); },
    async downloadMedia(url) {
      const res = await fetch(url, { headers: { Authorization: auth } });
      if (!res.ok) throw new Error(`downloadMedia ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}
