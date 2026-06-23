// app/api/videoloft/live/hls/route.js
//
// GATED HLS proxy. The browser's HLS player can't attach the ManythingToken
// header to cross-origin segment requests, so every playlist + segment is
// fetched here (server-side, with the header) and served same-origin. Playlist
// URLs are rewritten so child playlists/segments come back through this proxy.
//
// GET /api/videoloft/live/hls?property=finca&w=<wowza>&s=<streamName>&f=index.m3u8

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchLiveResource, isVideoloftHost } from "@/lib/videoloft/client";
import { verifyAccess, ACCESS_COOKIE } from "@/lib/videoloft/access";

export const dynamic = "force-dynamic";

const M3U8 = "application/vnd.apple.mpegurl";

function rewritePlaylist(text, { property, w, s }) {
  const base = `/api/videoloft/live/hls?property=${encodeURIComponent(property)}&w=${encodeURIComponent(w)}&s=${encodeURIComponent(s)}&f=`;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line; // tags/comments untouched
      // A bare URI line (child playlist or media segment). Route it through us.
      return base + encodeURIComponent(trimmed);
    })
    .join("\n");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property") || "";
  const w = searchParams.get("w") || "";
  const s = searchParams.get("s") || "";
  const f = searchParams.get("f") || "index.m3u8";

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!verifyAccess(token, property)) {
    return new NextResponse("Access required", { status: 401 });
  }
  if (!w || !s || !isVideoloftHost(w)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const upstream = await fetchLiveResource(w, s, f);
    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const isPlaylist = f.includes(".m3u8");
    if (isPlaylist) {
      const text = await upstream.text();
      return new NextResponse(rewritePlaylist(text, { property, w, s }), {
        status: 200,
        headers: { "Content-Type": M3U8, "Cache-Control": "no-store" },
      });
    }

    // Media segment — stream the bytes straight through.
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "video/mp4",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("hls proxy error", err.message);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
