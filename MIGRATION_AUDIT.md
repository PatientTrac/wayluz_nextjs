# WayLuz Horizons Export Audit

## Export classification

The uploaded file is a Hostinger Horizons export. It is a React/Vite application, not WordPress.

Key source files found:

- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/pages/*`
- `src/components/*`
- `src/lib/customSupabaseClient.js`
- `src/lib/supabaseStorageClient.js`

## Original app routes

The original `src/App.jsx` defined these React Router routes:

- `/`
- `/properties`
- `/properties/:slug`
- `/about`
- `/contact`
- `/finca-aerial`
- `/admin-login`
- `/admin/*`
- `/diagnostic`

The Next.js package maps these to App Router folders.

## Supabase usage discovered

Main Supabase table:

- `properties`

Other table:

- `page_visits`

Storage bucket:

- `property-images`

Authentication:

- Supabase Auth sign-in for `admin@wayluz.com` in the original export

## Security issues found and changed

1. The original export contained hardcoded Supabase client configuration in `src/lib/customSupabaseClient.js`.
   - Changed to env vars.

2. The original admin flow contained a client-side access code.
   - Removed from source.
   - Admin authentication now depends on Supabase Auth credentials.

3. The original contact form stored submissions in `localStorage`.
   - Changed to a Next.js API route and Supabase table insert.

4. Diagnostic pages existed in the export.
   - `/diagnostic` is disabled unless explicitly enabled by env var.

## Production caution

Do not delete the Hostinger Horizons deployment until the Netlify preview is tested with the live Supabase data, storage uploads, admin login, contact submissions, and DNS redirect behavior.
