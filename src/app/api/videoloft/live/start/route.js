// app/api/videoloft/live/start/route.js
//
// GATED — requires the signed access cookie. Starts a camera streaming and
// returns the Wowza host + live stream name so the player can hit the HLS proxy.
//
// POST body: { property, uidd }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAllowed } from "@/lib/videoloft/cameras";
import { startLive } from "@/lib/videoloft/client";
import { verifyAccess, ACCESS_COOKIE } from "@/lib/videoloft/access";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { property, uidd } = body;

  if (!property || !uidd || !isAllowed(property, uidd)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!verifyAccess(token, property)) {
    return NextResponse.json({ error: "Access required" }, { status: 401 });
  }

  try {
    const { wowza, streamName } = await startLive(uidd);
    return NextResponse.json({ wowza, streamName });
  } catch (err) {
    console.error("live start error", uidd, err.message);
    return NextResponse.json({ error: "Could not start live stream" }, { status: 502 });
  }
}
