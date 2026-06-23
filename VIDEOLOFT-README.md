# Videoloft live cameras — wayluz.com integration

Drop-in module for the **wayluz.com** real-estate site (`PatientTrac/wayluz_nextjs`,
Next.js 14 App Router). Public snapshot grid + gated live HLS, leads captured to
Supabase (HubSpot deferred).

> ⚠️ This goes in the **wayluz_nextjs** repo, NOT wayluz-farm-saas. Confirm you're
> in `~/wayluz_nextjs/wayluz_nextjs/` before copying.

## File placement

```
lib/videoloft/cameras.js                      whitelist (which cams are public)
lib/videoloft/client.js                       server-only Videoloft client
lib/videoloft/access.js                       signed gate token
app/api/videoloft/snapshot/route.js           public still images
app/api/videoloft/access/route.js             lead form -> cookie
app/api/videoloft/live/start/route.js         gated: start a stream
app/api/videoloft/live/keepalive/route.js     gated: keep it alive
app/api/videoloft/live/hls/route.js           gated: HLS proxy (token injection)
components/PropertyCameras.jsx                 the UI
```

The routes use the `@/` path alias and `@supabase/supabase-js`, both already in
this project. If `server-only` isn't installed: `npm i server-only`.

## Install

```bash
npm i hls.js
```

## Environment variables (Netlify → Site settings → Environment variables)

Server-side only — **no `NEXT_PUBLIC_` prefix** on any of these:

```
VIDEOLOFT_EMAIL            = wayne@patienttrac.com
VIDEOLOFT_PASSWORD         = <your NEW Videoloft password>   # rotate it first
VIDEOLOFT_GATE_SECRET      = <a long random string>          # e.g. openssl rand -hex 32
SUPABASE_SERVICE_ROLE_KEY  = <service role key from Supabase>
```

`NEXT_PUBLIC_SUPABASE_URL` is already set. After adding env vars, trigger a
Netlify redeploy (env changes don't apply to the running build).

## Supabase table (run in the wayluz.com project's SQL editor)

```sql
create table if not exists public.camera_access_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  phone       text,
  property    text not null,
  user_agent  text
);
-- Inserts happen with the service-role key from the server, which bypasses RLS.
-- Keep RLS enabled so the anon key can't read leads from the browser.
alter table public.camera_access_requests enable row level security;
```

Optional — to move the whitelist into the DB later instead of cameras.js:

```sql
alter table public.properties
  add column if not exists videoloft_cameras jsonb default '[]'::jsonb;
-- store: [{ "uidd": "1253490.169", "label": "Área de la piscina" }, ...]
```

## Use it on a listing page

```jsx
import PropertyCameras from "@/components/PropertyCameras";
import { camerasFor } from "@/lib/videoloft/cameras";

export default function Page() {
  return (
    <PropertyCameras property="finca" cameras={camerasFor("finca")} />
  );
}
// Palestina: <PropertyCameras property="palestina" cameras={camerasFor("palestina")} />
```

## How it behaves

- **Snapshots** are public, refresh every 45s, and only ever show whitelisted
  cameras. No token or Videoloft URL reaches the browser.
- **Live** requires the lead form. On submit, the lead is saved to Supabase and a
  30-minute signed cookie is set. Clicking a camera then starts its stream,
  plays it through the same-origin HLS proxy, and sends a keep-alive every 25s.
  Closing the player stops the keep-alive (camera stops ~60s later).
- A camera that isn't whitelisted returns 404 from every route — the whitelist
  in `cameras.js` is the hard security boundary.

## Adding HubSpot later

In `app/api/videoloft/access/route.js` there's a marked TODO. Once you confirm
whether wayluz.com has its own HubSpot path (or replicate the agro
`lead_submit` pattern), forward the lead there. Keep portal IDs/keys in
server-side env vars, same as everything else.

## Loose ends to confirm

- Rotate the Videoloft password (it was shared in chat).
- Decide whether snapshots of the finca exteriors are OK to be fully public, or
  whether you also want those gated (move the snapshot route behind `verifyAccess`).
- The `VLYdEy` group (8 unnamed "hikvision 3192" cameras) isn't wired anywhere.
