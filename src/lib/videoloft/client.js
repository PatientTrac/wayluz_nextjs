// lib/videoloft/client.js
//
// Server-only Videoloft API client. NEVER import this into a client component.
//
// Required env vars (Netlify, server-side — NO NEXT_PUBLIC_ prefix):
//   VIDEOLOFT_EMAIL
//   VIDEOLOFT_PASSWORD
// Optional:
//   VIDEOLOFT_AUTH_BASE   (defaults to https://auth1.manything.com)

import "server-only";

const AUTH_BASE = process.env.VIDEOLOFT_AUTH_BASE || "https://auth1.manything.com";

const ALLOWED_HOST_SUFFIXES = [".manything.com", ".videoloft.live"];
export function isVideoloftHost(host) {
  return ALLOWED_HOST_SUFFIXES.some((suf) => host.endsWith(suf));
}

let _session = null;
// Per-uidd cache so cameras can NEVER share a logger/streamname.
const _devices = new Map(); // uidd -> { value, at, promise }

const TOKEN_TTL_MS = 15 * 60 * 1000;
const DEVICE_TTL_MS = 10 * 60 * 1000;

function authHeader(token) {
  return { Authorization: `ManythingToken ${token}` };
}

async function rawLogin() {
  const body = JSON.stringify({
    email: process.env.VIDEOLOFT_EMAIL,
    password: process.env.VIDEOLOFT_PASSWORD,
  });
  let res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  let data = await res.json();
  if (data.location) {
    res = await fetch(`${data.location}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    data = await res.json();
  }
  if (!data.result?.authToken) throw new Error("Videoloft login failed");
  return data.result;
}

async function refresh(authenticator, webLogin) {
  const res = await fetch(`${authenticator}/login/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webLogin),
  });
  if (!res.ok) return null;
  return (await res.json()).result;
}

export async function getSession() {
  const now = Date.now();
  if (_session && now < _session.expiresAt) return _session;

  let result = null;
  if (_session?.webLogin && _session?.authenticator) {
    result = await refresh(_session.authenticator, _session.webLogin);
  }
  if (!result) result = await rawLogin();

  _session = {
    authToken: result.authToken,
    authenticator: result.authenticator,
    webLogin: result.webLogin,
    uid: result.uid,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return _session;
}

/**
 * Resolve logger / wowza / streamname for ONE uidd, cached per-uidd (~10 min).
 * Each uidd has its own cache slot and in-flight promise — concurrent lookups
 * for different cameras never collide (this was the same-image bug).
 */
export async function resolveDevice(uidd) {
  const now = Date.now();
  const slot = _devices.get(uidd);
  if (slot?.value && now - slot.at < DEVICE_TTL_MS) return slot.value;
  if (slot?.promise) return slot.promise;

  const promise = (async () => {
    const s = await getSession();
    const res = await fetch(
      `${s.authenticator}/devices/viewerInfo?uidd=${encodeURIComponent(uidd)}`,
      { headers: authHeader(s.authToken) }
    );
    const result = res.ok ? (await res.json()).result || {} : {};
    const [uid, devId] = uidd.split(".");
    const dev = result[uid]?.devices?.[devId];
    const value = dev
      ? { logger: dev.logger, wowza: dev.wowza, streamname: dev.streamname }
      : null;
    _devices.set(uidd, { value, at: Date.now(), promise: null });
    return value;
  })();

  _devices.set(uidd, { value: slot?.value ?? null, at: slot?.at ?? 0, promise });
  return promise;
}

export async function getStatus(uidd) {
  const dev = await resolveDevice(uidd);
  if (!dev?.logger) throw new Error(`No logger for ${uidd}`);
  const s = await getSession();
  const res = await fetch(
    `https://${dev.logger}/cameras/status?uidd=${encodeURIComponent(uidd)}`,
    { headers: authHeader(s.authToken) }
  );
  if (!res.ok) throw new Error(`status ${res.status}`);
  const result = (await res.json()).result || {};
  const [uid, devId] = uidd.split(".");
  return result[uid]?.devices?.[devId] || null;
}

async function sendCameraTask(uidd, action) {
  const dev = await resolveDevice(uidd);
  if (!dev?.logger) throw new Error(`No logger for ${uidd}`);
  const s = await getSession();
  const url = `https://${dev.logger}/sendcameratask?uid=${encodeURIComponent(uidd)}&action=${action}&token=${encodeURIComponent(s.authToken)}`;
  const res = await fetch(url, { headers: authHeader(s.authToken) });
  if (!res.ok) throw new Error(`${action} failed (${res.status})`);
  return true;
}

export const triggerLive = (uidd) => sendCameraTask(uidd, "livecommand");
export const captureThumb = (uidd) => sendCameraTask(uidd, "capturethumb");

export async function getThumbnail(uidd, { fresh = false } = {}) {
  const dev = await resolveDevice(uidd);
  if (!dev?.logger) throw new Error(`No logger for ${uidd}`);

  if (fresh) {
    try {
      await captureThumb(uidd);
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      /* fall back to existing thumb */
    }
  }

  const status = await getStatus(uidd);
  const time = status?.lastthumb;
  if (!time) throw new Error(`No thumbnail available for ${uidd}`);

  const s = await getSession();
  const url = `https://${dev.logger}/getthumb/${uidd}/${time}/${s.authToken}`;
  const res = await fetch(url, { headers: authHeader(s.authToken) });
  if (!res.ok) throw new Error(`getthumb ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: res.headers.get("content-type") || "image/jpeg" };
}

export async function startLive(uidd) {
  await triggerLive(uidd);
  for (let i = 0; i < 12; i++) {
    const status = await getStatus(uidd);
    if (status?.live && status?.wowza) {
      return {
        wowza: status.wowza,
        streamName: status.liveStreamName || status.sdLiveStreamName,
      };
    }
    await new Promise((r) => setTimeout(r, 1000));
    if (i % 2 === 1) await triggerLive(uidd);
  }
  throw new Error(`Camera ${uidd} did not go live in time`);
}

export async function fetchLiveResource(wowza, streamName, file) {
  if (!isVideoloftHost(wowza)) throw new Error("Disallowed host");
  const s = await getSession();
  const url = `https://${wowza}/manything/${streamName}/${file}`;
  return fetch(url, { headers: authHeader(s.authToken) });
}
