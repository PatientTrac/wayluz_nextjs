// app/api/videoloft/access/route.js
//
// Lead-gated access grant. Visitor submits name/email -> we record the lead and
// set a short-lived signed cookie that unlocks live viewing.
//
// POST body: { name, email, phone?, property }
//
// Required env vars (server-side):
//   VIDEOLOFT_GATE_SECRET
//   NEXT_PUBLIC_SUPABASE_URL  (already present on the project)
//   SUPABASE_SERVICE_ROLE_KEY (server-only — do NOT expose to the client)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signAccess, ACCESS_COOKIE } from "@/lib/videoloft/access";
import { PROPERTIES } from "@/lib/videoloft/cameras";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim();
  const property = (body.property || "").trim();

  if (!name || !EMAIL_RE.test(email) || !PROPERTIES[property]) {
    return NextResponse.json({ error: "Please enter a valid name and email." }, { status: 400 });
  }

  // 1) Record the lead in Supabase (see README for table DDL).
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    await supabase.from("camera_access_requests").insert({
      name,
      email,
      phone: phone || null,
      property,
      user_agent: request.headers.get("user-agent") || null,
    });
  } catch (err) {
    // Don't block access on a logging failure, but do record it.
    console.error("lead insert failed", err.message);
  }

  // 2) TODO(HubSpot): once the wayluz.com repo's HubSpot path is confirmed,
  //    forward this lead here as event === 'lead_submit'. Until then, no-op.
  //    e.g. await syncHubspotLead({ name, email, phone, property });

  // 3) Grant the viewing session.
  const token = signAccess({ property, email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return res;
}
