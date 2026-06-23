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

// Per-uidd device cache. Each entry is resolved from ONE shared batched fetch,
// so cameras can never end up with another camera's logger/streamname.
const _devices = new Map(); // uidd -> { logger, wowza, streamname }
let _devicesAt = 0;
let _allDevicesPromise = null; // single in-flight batched lookup

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
 * Resolve EVERY device the account can see in one batched /devices + viewerInfo
 * pass, cached ~10 min. One request, correctly keyed per camera — no races, no
 * cross-camera bleed. Returns the full uidd -> {logger,wowza,streamname} map.
 */
async function ensureAllDevices() {
  const now = Date.now();
  if (_devices.size > 0 && now - _devicesAt < DEVICE_TTL_MS) return _devices;
  if (_allDevicesPromise) return _allDevicesPromise;

  _allDevicesPromise = (async () => {
    const s = await getSession();

    // 1) enumerate all uidds via the multi-user /devices endpoint
    const dRes = await fetch(`${s.authenticator}/devices`, {
      headers: authHeader(s.authToken),
    });
    const dResult = dRes.ok ? (await dRes.json()).result || {} : {};
    const uidds = [];
    for (const group of Object.values(dResult)) {
      if (!group?.devices) continue;
      for (const [devId, dev] of Object.entries(group.devices)) {
        uidds.push(dev.uidd || `${devId}`);
      }
    }

    // 2) resolve logger/wowza/streamname for all of them, in chunks of 20
    const map = new Map();
    for (let i = 0; i < uidds.length; i += 20) {
      const batch = uidds.slice(i, i + 20);
      const qs = batch.map((u) => `uidd=${encodeURIComponent(u)}`).join("&");
      const vRes = await fetch(`${s.authenticator}/devices/viewerInfo?${qs}`, {
        headers: authHeader(s.authToken),
      });
      const vResult = vRes.ok ? (await vRes.json()).result || {} : {};
      for (const group of Object.values(vResult)) {
        if (!group.devices) continue;
        for (const dev of Object.values(group.devices)) {
          map.set(dev.uidd, {
            logger: dev.logger,
            wowza: dev.wowza,
            streamname: dev.streamname,
          });
        }
      }
    }

    _devices.clear();
    for (const [k, v] of map) _devices.set(k, v);
    _devicesAt = Date.now();
    _allDevicesPromise = null;
    return _devices;
  })();

  return _allDevicesPromise;
}

export async function resolveDevice(uidd) {
  const map = await ensureAllDevices();
  return map.get(uidd) || null;
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
