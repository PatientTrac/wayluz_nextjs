// AES-256-GCM encryption for credentials stored in the DB.
// Key comes from env (WHATSAPP_CONFIG_KEY) — the database never sees the key
// or the plaintext, only the ciphertext this produces.

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function key() {
  const k = process.env.WHATSAPP_CONFIG_KEY;
  if (!k) throw new Error('Missing WHATSAPP_CONFIG_KEY');
  return crypto.createHash('sha256').update(k).digest(); // 32 bytes
}

// returns base64(iv|tag|ciphertext), or null for empty input
export function encryptSecret(plain) {
  if (plain == null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptSecret(enc) {
  if (!enc) return null;
  const buf = Buffer.from(enc, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const d = crypto.createDecipheriv(ALGO, key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}
