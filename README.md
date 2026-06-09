# WayLuz Hostinger Horizons to Next.js Migration

This repository is a converted Next.js App Router version of the uploaded Hostinger Horizons export.

## What was converted

- Source app: Hostinger Horizons React/Vite export
- Target app: Next.js App Router
- Deployment target: Netlify
- Backend target: existing Supabase project
- Styling: original Tailwind/shadcn-style components kept
- Main public routes preserved:
  - `/`
  - `/about`
  - `/properties`
  - `/properties/[slug]`
  - `/contact`
  - `/finca-aerial`
  - `/admin-login`
  - `/admin`

## Important changes applied

1. **Vite routing replaced by Next.js App Router**
   - The old `react-router-dom` usage was replaced with a small compatibility adapter in `src/lib/routerAdapter.jsx`.
   - Each old page component is now rendered through `src/app/.../page.jsx`.

2. **Hardcoded Supabase config removed**
   - The original Horizons export had the Supabase URL and anon key directly in `src/lib/customSupabaseClient.js`.
   - This migration now reads:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Hardcoded admin passcode removed**
   - The original export had a client-side access code.
   - This migration authenticates admin users through Supabase Auth only.
   - Create the admin user manually in Supabase Auth and set the password there.

4. **Contact form now posts to a Next.js API route**
   - Old behavior: save submissions to browser `localStorage`.
   - New behavior: POST `/api/contact`, then insert into `public.contact_submissions`.

5. **Diagnostics disabled by default**
   - `/diagnostic` now returns a disabled message unless `NEXT_PUBLIC_ENABLE_DIAGNOSTICS=true`.

## Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL=admin@wayluz.com
NEXT_PUBLIC_ENABLE_DIAGNOSTICS=false
```

Optional server-only variable for API routes:

```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Do not expose the service role key in browser code or commit it to GitHub.

## Install and run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Netlify settings

The included `netlify.toml` uses:

```toml
[build]
  command = "npm run build"
  publish = ".next"
```

Set the same environment variables in Netlify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL`
- `NEXT_PUBLIC_ENABLE_DIAGNOSTICS=false`
- `SUPABASE_SERVICE_ROLE_KEY` if you want server routes to bypass RLS safely

## Supabase tables/storage expected by the app

The existing app expects:

### `public.properties`

Columns inferred from the Horizons export:

- `id`
- `name`
- `location`
- `description`
- `price_cop`
- `price_usd`
- `area`
- `bedrooms`
- `bathrooms`
- `year_built`
- `type`
- `amenities`
- `images`
- `videos`
- `featured_image_url`
- `created_at`

A reference-only schema is included at:

```text
supabase/schema-reference.properties.sql
```

### `public.page_visits`

Used by the visit counter. Migration included:

```text
supabase/migrations/20260608235100_page_visits.sql
```

### `public.contact_submissions`

Used by the new Next.js contact API route. Migration included:

```text
supabase/migrations/20260608235000_contact_submissions.sql
```

### Storage bucket: `property-images`

Used by `src/lib/supabaseStorageClient.js`. Migration included:

```text
supabase/migrations/20260608235200_property_images_storage.sql
```

## Recommended Supabase setup before production

1. Confirm the existing `properties` table matches the inferred columns.
2. Apply the included migrations for contact submissions, visits, and storage policies.
3. Create the admin user manually in Supabase Auth:
   - Email: value of `NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL`, default `admin@wayluz.com`
   - Password: your private admin access code
4. Confirm RLS policies allow:
   - Public read for published/displayable properties, if required
   - Authenticated admin insert/update/delete for properties
   - Public insert into `contact_submissions`
   - Authenticated read of contact submissions
   - Authenticated storage uploads to `property-images`

## Known follow-ups

- Replace `react-helmet` page metadata with native Next.js metadata for stronger SEO.
- Add a real `slug` column to `properties`; the current detail page loads all property names and matches a slug client-side.
- Review and remove unused debug pages before final production launch.
- Add spam protection to `/api/contact`, such as a honeypot field, Turnstile, or rate limiting.
- Add email/CRM notifications for new contact submissions.
- Run `npm install` and `npm run build` after setting env vars. Dependencies were not installed inside this sandbox, so this package has not been runtime-built here.
