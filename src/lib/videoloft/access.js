// lib/videoloft/access.js
//
// Signed access grant for live camera viewing. After a visitor submits the lead
// form, we set a short-lived signed cookie; the live routes require it.
//
// Required env var (server-side): VIDEOLOFT_GATE_SECRET  (a long random string)

import "server-only";
import crypto from "node:crypto";

export const ACCESS_COOKIE = "vl_access";
const TTL_MS = 30 * 60 * 1000; // 30-minute viewing session

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function secret() {
  const s = process.env.VIDEOLOFT_GATE_SECRET;
  if (!s) throw new Error("VIDEOLOFT_GATE_SECRET is not set");
  return s;
}

/** Create a signed token granting live access (optionally scoped to a property). */
export function signAccess({ property = "*", email = "" } = {}) {
  const payload = { p: property, e: email, exp: Date.now() + TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Verify a token. Returns the payload if valid & unexpired, else null. */
export function verifyAccess(token, property) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  if (property && payload.p !== "*" && payload.p !== property) return null;
  return payload;
}
