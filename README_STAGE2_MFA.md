# Stage 2 — Authenticator-app 2FA + change password

Adds TOTP two-factor (Google Authenticator / Authy / 1Password) on top of the
email + password login, plus a self-service "change password" that works without
email/SMTP. This package is cumulative — it also contains the earlier changes
(Google sign-in removed, session in sessionStorage so closing the browser logs
you out). Deploy this one and you're fully current.

## Files
| File | Path | Change |
|---|---|---|
| AdminAuthContext.jsx | src/context/ | adds TOTP enroll/verify, AAL gate, changePassword; session in sessionStorage |
| AdminLoginPage.jsx | src/views/ | email+password, then a 6-digit code step when 2FA is on |
| AdminPanel.jsx | src/views/ | "Security" button in the header; opens the panel |
| SecurityModal.jsx | src/components/ | NEW — enable/disable 2FA (QR), change password |
| customSupabaseClient.js | src/lib/ | session stored in sessionStorage (logout on browser close) |

No new SQL and no new env vars. TOTP and updateUser() need neither SMTP nor extra
Supabase config (TOTP is on by default in Supabase Auth).

## How sign-in works now
1. Email + password.
2. If that account has an authenticator enrolled → enter the 6-digit code → in.
3. If it doesn't have one yet → you're let in, and the **Security** panel opens
   automatically so you can set it up.

## First-time setup (bootstrap)
Because no one has 2FA yet, your next login goes straight in and pops the Security
panel. There:
- **Enable 2FA** → scan the QR in Google Authenticator (or type the secret) →
  enter the 6-digit code → Verify. From then on every sign-in asks for a code.
- **Change password** → set a new one immediately, no email needed. (This is the
  reliable path since SMTP isn't set up; "Forgot password" on the login screen
  still needs SMTP to actually send.)

## Recovery note
2FA is per-Supabase-user. If someone loses their authenticator, an admin can clear
it from **Supabase → Authentication → Users → (user) → Factors → remove**, or in
SQL. Worth keeping one admin account whose authenticator lives somewhere safe.

## Next
Stage 3: DeepL Spanish↔English translation in the inbox.
