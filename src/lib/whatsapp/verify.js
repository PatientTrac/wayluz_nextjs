// Verifies that an inbound webhook POST really came from Meta.
// Meta signs the raw request body with your App Secret (sha256) and sends it
// in the `x-hub-signature-256` header as `sha256=<hex>`.

import crypto from 'crypto';

export function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  // constant-time compare
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
