// Loads the effective WhatsApp (Twilio) config for this app.
// Order of precedence per field: DB row value -> env var fallback.
// So an app can be configured entirely from the admin screen, entirely from
// env, or any mix. The Auth Token is decrypted here, server-side only.

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
    accountSid:    row.account_sid   || process.env.TWILIO_ACCOUNT_SID || null,
    authToken:     safeDecrypt(row.auth_token_enc) || process.env.TWILIO_AUTH_TOKEN || null,
    fromNumber:    row.from_number   || process.env.TWILIO_WHATSAPP_FROM || null,
    displayNumber: row.display_number || null,
    displayName:   row.display_name   || null,
  };
}
