# WhatsApp Inbox — setup & per-project reuse

A self-hosted WhatsApp inbox you embed in each project's own site, behind your
logged-in users. Built on **Meta WhatsApp Cloud API** (the messaging pipe) with
**KrispCall as the number provider** (one number per project).

## Architecture (why it's built this way)

```
KrispCall number  ──>  YOUR Meta WhatsApp app (Cloud API)  ──>  this module  ──>  your DB + UI
 (per project)          webhook in / Graph API out                              (WayLuz: Supabase)
```

- KrispCall supplies a clean virtual number per project and receives the Meta
  verification code. That's its whole job here. **Do not also turn on KrispCall's
  own WhatsApp on that number** — a number's WhatsApp connects to exactly one place.
- The number is registered to *your* Meta app, so you own the webhooks, the data,
  and the UI. KrispCall's own API is telephony only (SMS/voice) and can't drive a
  custom WhatsApp inbox, which is why we go to Meta directly.

## Files

| File | Role |
|---|---|
| `supabase/migrations/20260618_whatsapp_inbox.sql` | tables + realtime + RLS |
| `src/lib/whatsapp/client.js` | Meta Graph API: send text/image/template, read receipts, media |
| `src/lib/whatsapp/verify.js` | inbound webhook signature check |
| `src/lib/whatsapp/supabaseAdmin.js` | server-side Supabase (service role) |
| `src/app/api/whatsapp/webhook/route.js` | GET verify + POST receive → persist |
| `src/app/api/whatsapp/send/route.js` | outbound send → persist |
| `src/components/WhatsAppInbox.jsx` | list + thread + composer, live via Realtime |
| `.env.whatsapp.example` | required env vars |

## WayLuz install

1. Copy `src/lib/whatsapp/`, the two `src/app/api/whatsapp/` routes, and
   `src/components/WhatsAppInbox.jsx` into the WayLuz repo.
2. Run the SQL migration against WayLuz's Supabase project.
3. `npm i @supabase/supabase-js` (already present in WayLuz).
4. Fill the env vars (Supabase ones already exist; WhatsApp ones come in step 6).
5. Add an admin page that renders the inbox, gated by your existing auth:
   ```jsx
   // src/app/(admin)/inbox/page.jsx
   'use client';
   import WhatsAppInbox from '@/components/WhatsAppInbox';
   import { supabase } from '@/lib/customSupabaseClient';      // WayLuz's browser client
   import ProtectedRoute from '@/components/ProtectedRoute';    // WayLuz's existing guard
   export default function Page() {
     return (
       <ProtectedRoute>
         <WhatsAppInbox supabase={supabase} inboxSecret={process.env.NEXT_PUBLIC_INBOX_API_SECRET} />
       </ProtectedRoute>
     );
   }
   ```

## Meta onboarding (do this when the KrispCall number is ready)

1. **developers.facebook.com** → Create App → type **Business** → add the
   **WhatsApp** product.
2. WhatsApp → **API Setup** → add the KrispCall number → it receives the
   verification code by SMS/voice → verify. Copy the **Phone Number ID** and the
   **WhatsApp Business Account ID**.
3. Business Settings → **System Users** → create one → generate a token with
   `whatsapp_business_messaging` + `whatsapp_business_management`. This is
   `WHATSAPP_TOKEN`.
4. App → Settings → Basic → copy **App Secret** → `WHATSAPP_APP_SECRET`.
5. WhatsApp → **Configuration** → Callback URL =
   `https://<project-domain>/api/whatsapp/webhook`, Verify token =
   your `WHATSAPP_VERIFY_TOKEN`. Subscribe to the **messages** field.
6. Deploy. Send a test message to the number → it should appear in the inbox live.

> Each project's Meta business verification can take ~1–3 days. That review is the
> only repeated friction — the code below doesn't change between projects.

## Reuse on a Neon/Clerk project (PatientTrac, AegisIQ)

The WhatsApp client, webhook logic, UI, and schema shape are identical. Swap three
adapters:

- **DB**: replace `supabaseAdmin.js` + the `.from(...)` calls with Drizzle/Neon queries.
- **Realtime**: Supabase Realtime → Ably or Pusher (the UI's subscribe block is the
  only part that changes).
- **Auth**: the page guard → Clerk's `<SignedIn>` / `auth()`; the send route → Clerk
  server-side session instead of the `x-inbox-secret` stop-gap.

## Notes

- **24h window**: free-text replies are allowed for 24h after the customer's last
  message — fine for an inbound-driven funnel (Facebook groups → people message you).
  Re-opening a colder thread needs an approved template.
- **Auth gate**: the send route currently uses a shared `x-inbox-secret`. Replace it
  with a real session check before going live.
- **Media**: inbound media arrives as an ID; `getMediaUrl` + `downloadMedia` fetch it,
  then re-host to Supabase Storage / Cloudinary and store the link in `media_url`.
