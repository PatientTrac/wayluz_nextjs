// Meta WhatsApp Cloud API client.
// One instance talks to ONE project's number (the Phone Number ID + token you got
// when you registered that project's KrispCall number to your Meta app).
//
// Env (per project):
//   WHATSAPP_GRAPH_VERSION   e.g. v23.0
//   WHATSAPP_PHONE_NUMBER_ID  the Meta Phone Number ID (NOT the +57... number)
//   WHATSAPP_TOKEN            system-user token w/ whatsapp_business_messaging

const GRAPH = 'https://graph.facebook.com';

function cfg() {
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) {
    throw new Error('WhatsApp client missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN');
  }
  return { version, phoneNumberId, token };
}

async function graphPost(path, payload) {
  const { version, token } = cfg();
  const res = await fetch(`${GRAPH}/${version}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data; // { messaging_product, contacts:[...], messages:[{id: 'wamid...'}] }
}

// Free-text reply. Only valid inside the 24h customer-service window.
export async function sendText(to, body) {
  const { phoneNumberId } = cfg();
  return graphPost(`${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body },
  });
}

// Image by public URL (e.g. a re-hosted media link or a listing photo).
export async function sendImage(to, link, caption) {
  const { phoneNumberId } = cfg();
  return graphPost(`${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link, caption },
  });
}

// Pre-approved template. Needed only to RE-OPEN a conversation older than 24h.
export async function sendTemplate(to, name, languageCode = 'es', components = []) {
  const { phoneNumberId } = cfg();
  return graphPost(`${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name, language: { code: languageCode }, components },
  });
}

// Mark an inbound message as read (blue ticks) — optional, nice UX.
export async function markRead(messageId) {
  const { phoneNumberId } = cfg();
  return graphPost(`${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  });
}

// Inbound media arrives as an ID; resolve it to a (short-lived, authed) download URL.
export async function getMediaUrl(mediaId) {
  const { version, token } = cfg();
  const res = await fetch(`${GRAPH}/${version}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`getMediaUrl ${res.status}: ${JSON.stringify(data)}`);
  return data.url; // must be fetched with the same Bearer token, then re-hosted
}

export async function downloadMedia(url) {
  const { token } = cfg();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`downloadMedia ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
