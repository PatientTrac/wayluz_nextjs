-- Table used by src/hooks/usePageVisits.js.
create table if not exists public.page_visits (
  page_name text primary key,
  visit_count bigint not null default 0,
  last_updated timestamptz not null default now()
);

alter table public.page_visits enable row level security;

drop policy if exists "Page visits are publicly readable" on public.page_visits;
create policy "Page visits are publicly readable"
on public.page_visits
for select
to anon, authenticated
using (true);

drop policy if exists "Page visits can be inserted publicly" on public.page_visits;
create policy "Page visits can be inserted publicly"
on public.page_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "Page visits can be updated publicly" on public.page_visits;
create policy "Page visits can be updated publicly"
on public.page_visits
for update
to anon, authenticated
using (true)
with check (true);
