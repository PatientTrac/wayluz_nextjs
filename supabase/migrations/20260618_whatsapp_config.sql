-- WhatsApp config (admin-managed) + admin allowlist.
-- Secrets are stored already-encrypted (AES-256-GCM) by the app; the DB only
-- ever sees ciphertext. RLS gives clients NO access — only the service role
-- (server routes) reads this table, so secrets never reach the browser.

create table if not exists wa_config (
  id              int primary key default 1 check (id = 1),  -- singleton row per app
  display_name    text,
  display_number  text,           -- e.g. +57 606 2488036 (human-readable)
  phone_number_id text,           -- Meta Phone Number ID
  waba_id         text,           -- WhatsApp Business Account ID
  graph_version   text default 'v23.0',
  verify_token    text,           -- low-risk; used in the webhook handshake
  token_enc       text,           -- AES-GCM ciphertext of the access token
  app_secret_enc  text,           -- AES-GCM ciphertext of the app secret
  updated_at      timestamptz not null default now(),
  updated_by      text
);

insert into wa_config (id) values (1) on conflict (id) do nothing;

-- Who may edit credentials. Seed yourself once (see below).
create table if not exists app_admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table wa_config  enable row level security;   -- no client policies = service-role only
alter table app_admins enable row level security;

-- Authenticated users may READ the admin list (emails aren't secret); the
-- authoritative check is still server-side. No client write policy.
create policy "authenticated read admins" on app_admins for select to authenticated using (true);

-- Seed the first admin (replace with your login email), then this row controls
-- who can open the settings screen and save credentials:
-- insert into app_admins (email) values ('you@wayluz.com') on conflict do nothing;
