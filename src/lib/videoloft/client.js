// lib/videoloft/client.js
//
// Server-only Videoloft API client. NEVER import this into a client component.
// It holds the account token and talks to Videoloft on behalf of your routes.
//
// Required env vars (set in Netlify, server-side — NO NEXT_PUBLIC_ prefix):
//   VIDEOLOFT_EMAIL
//   VIDEOLOFT_PASSWORD
// Optional:
//   VIDEOLOFT_AUTH_BASE   (defaults to https://auth1.manything.com)

import "server-only";

const AUTH_BASE = process.env.VIDEOLOFT_AUTH_BASE || "https://auth1.manything.com";

// Only ever proxy/stream from these Videoloft hosts (SSRF guard).
const ALLOWED_HOST_SUFFIXES = [".manything.com", ".videoloft.live"];

export function isVideoloftHost(host) {
  return ALLOWED_HOST_SUFFIXES.some((suf) => host.endsWith(suf));
}

// ---- module-level caches (persist across warm serverless invocations) ----
let _session = null; // { authToken, authenticator, webLogin, uid, expiresAt }
let _devicePromise = null; // in-flight viewerInfo refresh
let _deviceCache = { at: 0, map: new Map() }; // uidd -> { logger, wowza, streamname }

const TOKEN_TTL_MS = 15 * 60 * 1000; // refresh before the 20-min expiry
const DEVICE_TTL_MS = 10 * 60 * 1000; // re-resolve loggers every 10 min

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

/** Returns a valid auth token + authenticator, refreshing/logging in as needed. */
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

/** Resolve logger / wowza / streamname for one or more uidds (cached ~10 min). */
async function ensureDevices(uidds) {
  const now = Date.now();
  const haveAll = uidds.every((u) => _deviceCache.map.has(u));
  if (haveAll && now - _deviceCache.at < DEVICE_TTL_MS) return _deviceCache.map;

  if (!_devicePromise) {
    _devicePromise = (async () => {
      const s = await getSession();
      const qs = uidds.map((u) => `uidd=${encodeURIComponent(u)}`).join("&");
      const res = await fetch(`${s.authenticator}/devices/viewerInfo?${qs}`, {
        headers: authHeader(s.authToken),
      });
      const result = res.ok ? (await res.json()).result || {} : {};
      const map = new Map(_deviceCache.map);
      for (const group of Object.values(result)) {
        if (!group.devices) continue;
        for (const dev of Object.values(group.devices)) {
          map.set(dev.uidd, {
            logger: dev.logger,
            wowza: dev.wowza,
            streamname: dev.streamname,
          });
        }
      }
      _deviceCache = { at: Date.now(), map };
      _devicePromise = null;
      return map;
    })();
  }
  return _devicePromise;
}

export async function resolveDevice(uidd) {
  const map = await ensureDevices([uidd]);
  return map.get(uidd) || null;
}

/** Current live/online status for a camera (live flag, wowza, liveStreamName, thumb time). */
export async function getStatus(uidd) {
  const dev = await resolveDevice(uidd);
  if (!dev?.logger) throw new Error(`No logger for ${uidd}`);
  const s = await getSession();
  const res = await fetch(`https://${dev.logger}/cameras/status?uidd=${encodeURIComponent(uidd)}`, {
    headers: authHeader(s.authToken),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const result = (await res.json()).result || {};
  const [uid, devId] = uidd.split(".");
  return result[uid]?.devices?.[devId] || null;
}

/** Send a camera task (livecommand, capturethumb, etc.) to a camera's logger. */
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

/** Fetch a still thumbnail (latest one the camera has). Returns { buffer, contentType }. */
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

/**
 * Ensure a camera is live-streaming, then return its Wowza host + live stream name.
 * Sends livecommand and polls status until live=true (up to ~12s).
 */
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
    if (i % 2 === 1) await triggerLive(uidd); // keep nudging it
  }
  throw new Error(`Camera ${uidd} did not go live in time`);
}

/** Fetch a live HLS resource (playlist or segment) with the auth header attached. */
export async function fetchLiveResource(wowza, streamName, file) {
  if (!isVideoloftHost(wowza)) throw new Error("Disallowed host");
  const s = await getSession();
  const url = `https://${wowza}/manything/${streamName}/${file}`;
  return fetch(url, { headers: authHeader(s.authToken) });
}
