// Loads the effective WhatsApp config for this app.
// Order of precedence per field: DB row value -> env var fallback.
// So an app can be configured entirely from the admin screen, entirely from
// env, or any mix. Secrets are decrypted here, server-side only.

import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { decryptSecret } from '@/lib/whatsapp/crypto';

function safeDecrypt(v) {
  try { return decryptSecret(v); } catch { return null; }
}

export async function getWaConfig() {
  const db = supabaseAdmin();
  const { data } = await db.from('wa_config').select('*').eq('id', 1).maybeSingle();
  const row = data || {};
  return {
    graphVersion:  row.graph_version   || process.env.WHATSAPP_GRAPH_VERSION || 'v23.0',
    phoneNumberId: row.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    wabaId:        row.waba_id         || process.env.WHATSAPP_WABA_ID || null,
    displayNumber: row.display_number  || null,
    displayName:   row.display_name    || null,
    verifyToken:   row.verify_token    || process.env.WHATSAPP_VERIFY_TOKEN || null,
    token:         safeDecrypt(row.token_enc)      || process.env.WHATSAPP_TOKEN || null,
    appSecret:     safeDecrypt(row.app_secret_enc) || process.env.WHATSAPP_APP_SECRET || null,
  };
}
