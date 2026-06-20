// DeepL translation helper (server-side only).
// Set DEEPL_API_KEY in the environment. Free-tier keys end with ':fx' and use
// the api-free host; pro keys use the paid host. If no key is set, translation
// is silently disabled and the inbox falls back to original text.
//
//   CUSTOMER_LANG = the language the customer reads/writes (default Spanish)
//   ADMIN_LANG    = the language the agent reads/writes (default English)

const DEEPL_KEY = (process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY || '').trim();

export const CUSTOMER_LANG = process.env.WA_CUSTOMER_LANG || 'ES';   // outbound target
export const ADMIN_LANG = process.env.WA_ADMIN_LANG || 'EN-US';      // inbound target

export function translationEnabled() {
  return !!DEEPL_KEY;
}

function deeplHost() {
  return DEEPL_KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
}

// translate(text, targetLang, sourceLang?) -> { text, detectedSourceLang } | null
// Returns null when disabled, empty, or on any error (caller falls back to original).
export async function translate(text, targetLang, sourceLang) {
  if (!DEEPL_KEY || !text || !text.trim()) return null;
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', targetLang);
  if (sourceLang) params.append('source_lang', sourceLang);
  try {
    const res = await fetch(`${deeplHost()}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error('[deepl] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const t = data?.translations?.[0];
    if (!t) return null;
    return { text: t.text, detectedSourceLang: t.detected_source_language };
  } catch (e) {
    console.error('[deepl] error', e);
    return null;
  }
}
