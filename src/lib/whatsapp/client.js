// Meta WhatsApp Cloud API client, built from a config object (see config.js).
// createWhatsAppClient(config) -> { sendText, sendImage, sendTemplate, markRead, getMediaUrl, downloadMedia }

const GRAPH = 'https://graph.facebook.com';

export function createWhatsAppClient(config) {
  const version = config.graphVersion || 'v23.0';
  const phoneNumberId = config.phoneNumberId;
  const token = config.token;
  if (!phoneNumberId || !token) {
    throw new Error('WhatsApp config missing phoneNumberId or token');
  }

  async function post(path, payload) {
    const res = await fetch(`${GRAPH}/${version}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(data)}`);
    return data;
  }

  return {
    // Free-text reply — valid only inside the 24h customer-service window.
    sendText(to, body) {
      return post(`${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp', recipient_type: 'individual', to,
        type: 'text', text: { preview_url: false, body },
      });
    },
    sendImage(to, link, caption) {
      return post(`${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'image', image: { link, caption },
      });
    },
    // Pre-approved template — needed only to RE-OPEN a conversation older than 24h.
    sendTemplate(to, name, languageCode = 'es', components = []) {
      return post(`${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'template',
        template: { name, language: { code: languageCode }, components },
      });
    },
    markRead(messageId) {
      return post(`${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp', status: 'read', message_id: messageId,
      });
    },
    async getMediaUrl(mediaId) {
      const res = await fetch(`${GRAPH}/${version}/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`getMediaUrl ${res.status}: ${JSON.stringify(data)}`);
      return data.url;
    },
    async downloadMedia(url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`downloadMedia ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}
