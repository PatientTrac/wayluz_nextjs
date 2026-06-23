// app/api/videoloft/snapshot/route.js
//
// PUBLIC route — returns a still image for a whitelisted camera.
// No token or Videoloft URL ever reaches the browser.
//
// GET /api/videoloft/snapshot?property=finca&uidd=1253490.169[&fresh=1]

import { NextResponse } from "next/server";
import { isAllowed } from "@/lib/videoloft/cameras";
import { getThumbnail } from "@/lib/videoloft/client";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");
  const uidd = searchParams.get("uidd");
  const fresh = searchParams.get("fresh") === "1";

  if (!property || !uidd || !isAllowed(property, uidd)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const { buffer, contentType } = await getThumbnail(uidd, { fresh });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // brief client cache; the component also cache-busts with &t=
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (err) {
    console.error("snapshot error", uidd, err.message);
    return new NextResponse("Snapshot unavailable", { status: 502 });
  }
}
