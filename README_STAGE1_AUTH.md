# Stage 1 — Core Admin Auth (email/password + Google, invite-only)

Turns the single shared "access code" login into real multi-user auth on top of
Supabase Auth: email + password, Google sign-in, forgot-password, and an
**invite-only allowlist** (`app_admins`). A valid session is never enough — the
email must be on the allowlist, so multi-user + Google is safe.

## Files in this package
| File | Goes to | What it does |
|---|---|---|
| `AdminAuthContext.jsx` | `src/context/AdminAuthContext.jsx` | login(email,password), loginWithGoogle(), resetPassword(), allowlist gate |
| `AdminLoginPage.jsx` | `src/views/AdminLoginPage.jsx` | email/password + Google + "forgot password" UI |
| `AdminLoginModal.jsx` | `src/components/AdminLoginModal.jsx` | same, modal version |
| `20260620_whatsapp_rls_admins.sql` | `supabase/migrations/` | locks chat-table reads to allowlisted admins |

Unchanged dependencies it relies on (already in the repo): `@/lib/customSupabaseClient`,
`@/lib/adminAuthHelper`, `@/components/ProtectedRoute`, and the `app_admins` table.

## Install
1. Drop the four files into the paths above (overwrite the existing three).
2. Run `20260620_whatsapp_rls_admins.sql` in the Supabase SQL editor.
3. Make sure every admin is **both** a Supabase Auth user *and* in `app_admins`:
   ```sql
   insert into app_admins (email) values ('person@company.com') on conflict do nothing;
   ```
4. Commit + push.

## Config you must set up (only you can)
- **Google OAuth** — in Google Cloud Console create an OAuth 2.0 Client (Web).
  Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`.
  Then Supabase → Authentication → Providers → Google → paste Client ID + Secret, enable.
  Add your site origin (e.g. `https://wayluz.com`) under Auth → URL Configuration → Redirect URLs.
- **SMTP** — Supabase → Authentication → settings → SMTP. Required for
  "forgot password" emails to actually send (the default sender is rate-limited
  and was failing). Email + password and Google work without it.

## How access works now
- Email/password or Google → Supabase session created.
- The context checks the email against `app_admins`. Not listed → signed out,
  shown "Not authorized." Listed → in.
- The SQL migration enforces the same allowlist at the database level for the
  chat tables, so the gate can't be bypassed client-side.

## Porting to another app
This is built for the **Supabase + Next.js** stack. To reuse elsewhere:
- Keep the allowlist concept (`app_admins`) and the RLS pattern as-is.
- Repoint `@/lib/customSupabaseClient` to that app's Supabase client.
- If the target app uses a different auth provider (e.g. Clerk/Neon), swap the
  three Supabase calls in `AdminAuthContext.jsx` (signInWithPassword,
  signInWithOAuth, resetPasswordForEmail) for that provider's equivalents — the
  allowlist gate and UI stay the same.

## Next stages
- Stage 2: TOTP authenticator-app MFA on top of this.
- Stage 3: DeepL Spanish↔English translation in the inbox.
