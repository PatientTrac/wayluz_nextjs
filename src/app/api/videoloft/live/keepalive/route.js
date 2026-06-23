// app/api/videoloft/live/keepalive/route.js
//
// GATED — the player calls this every ~25s while a viewer is watching, so the
// camera keeps streaming. Stop calling it and the camera stops ~60s later.
//
// POST body: { property, uidd }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAllowed } from "@/lib/videoloft/cameras";
import { triggerLive } from "@/lib/videoloft/client";
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
    await triggerLive(uidd);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "keepalive failed" }, { status: 502 });
  }
}
