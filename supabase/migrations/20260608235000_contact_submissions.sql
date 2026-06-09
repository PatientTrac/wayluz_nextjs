-- Contact form submissions for the Next.js migration.
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  property_interest text,
  message text not null,
  source text default 'wayluz.com',
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

drop policy if exists "Public can submit contact form" on public.contact_submissions;
create policy "Public can submit contact form"
on public.contact_submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can read contact submissions" on public.contact_submissions;
create policy "Authenticated users can read contact submissions"
on public.contact_submissions
for select
to authenticated
using (true);
