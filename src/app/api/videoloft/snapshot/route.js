// app/api/videoloft/snapshot/route.js
//
// PUBLIC route — returns a still image for a whitelisted camera.
//
// Self-contained per request: it resolves THIS camera's logger, reads THIS
// camera's status, and fetches THIS camera's thumb, with no shared mutable
// device cache that a concurrent request could overwrite. Only the auth token
// is cached (via getSession). This mirrors the standalone diagnostic that
// provably returns correct per-camera images.
//
// GET /api/videoloft/snapshot?property=finca&uidd=1253490.169[&fresh=1]

import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/videoloft/cameras";
import { getSession } from "@/lib/videoloft/client";

export const dynamic = "force-dynamic";

const H = (t) => ({ Authorization: `ManythingToken ${t}` });

async function viewerInfo(auth, token, uidd) {
  const r = await fetch(`${auth}/devices/viewerInfo?uidd=${encodeURIComponent(uidd)}`, {
    headers: H(token),
  });
  if (!r.ok) return null;
  const res = (await r.json()).result || {};
  const [uid, dev] = uidd.split(".");
  return res[uid]?.devices?.[dev] || null;
}

async function status(logger, token, uidd) {
  const r = await fetch(`https://${logger}/cameras/status?uidd=${encodeURIComponent(uidd)}`, {
    headers: H(token),
  });
  if (!r.ok) return null;
  const res = (await r.json()).result || {};
  const [uid, dev] = uidd.split(".");
  return res[uid]?.devices?.[dev] || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");
  const uidd = searchParams.get("uidd");
  const fresh = searchParams.get("fresh") === "1";

  if (!property || !uidd || !isAllowed(property, uidd)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const s = await getSession();
    const token = s.authToken;

    // 1) resolve THIS camera's logger (fresh, per request)
    const dev = await viewerInfo(s.authenticator, token, uidd);
    if (!dev?.logger) return new NextResponse("No logger", { status: 502 });

    // 2) optionally trigger a fresh capture on THIS camera
    if (fresh) {
      try {
        await fetch(
          `https://${dev.logger}/sendcameratask?uid=${encodeURIComponent(uidd)}&action=capturethumb&token=${encodeURIComponent(token)}`,
          { headers: H(token) }
        );
        await new Promise((r) => setTimeout(r, 1500));
      } catch {
        /* fall back to existing thumb */
      }
    }

    // 3) read THIS camera's status and verify it really is this camera
    const st = await status(dev.logger, token, uidd);
    if (!st || st.uidd !== uidd || !st.lastthumb) {
      return new NextResponse("Snapshot unavailable", { status: 502 });
    }

    // 4) fetch THIS camera's thumb at its own lastthumb time
    const img = await fetch(
      `https://${dev.logger}/getthumb/${uidd}/${st.lastthumb}/${token}`,
      { headers: H(token) }
    );
    if (!img.ok) return new NextResponse("Snapshot unavailable", { status: 502 });

    const buf = Buffer.from(await img.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": img.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store", // each uidd is distinct; don't let a CDN dedupe
      },
    });
  } catch (err) {
    console.error("snapshot error", uidd, err.message);
    return new NextResponse("Snapshot unavailable", { status: 502 });
  }
}
