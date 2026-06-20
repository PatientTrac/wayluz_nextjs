// Verifies that an inbound webhook POST really came from Twilio.
// Twilio builds a string from the full request URL + the alphabetically-sorted
// POST params (concatenated as key+value), signs it with your Auth Token using
// HMAC-SHA1, base64-encodes it, and sends it in the `x-twilio-signature` header.
// Docs: https://www.twilio.com/docs/usage/security#validating-requests

import crypto from 'crypto';

export function verifyTwilioSignature(authToken, url, params, signatureHeader) {
  if (!authToken || !signatureHeader) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  const expected = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf8'))
    .digest('base64');
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
