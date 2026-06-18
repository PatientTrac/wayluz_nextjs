-- WhatsApp Inbox schema (Supabase / Postgres)
-- Reusable across projects. Prefix `wa_` keeps it isolated from existing tables.

create extension if not exists "pgcrypto";

-- A person on the other end of a conversation (the customer).
create table if not exists wa_contacts (
  id          uuid primary key default gen_random_uuid(),
  wa_id       text not null unique,          -- their phone in wa_id form, e.g. 573209937784
  name        text,                          -- WhatsApp profile name (from inbound webhook)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One thread per contact.
create table if not exists wa_conversations (
  id                  uuid primary key default gen_random_uuid(),
  contact_id          uuid not null references wa_contacts(id) on delete cascade,
  status              text not null default 'open'   -- 'open' | 'closed'
                        check (status in ('open','closed')),
  assigned_to         text,                          -- agent id / email (your logon user)
  last_message_at     timestamptz,
  last_message_preview text,
  -- The 24h customer-service window: free-text replies allowed until this time.
  window_expires_at   timestamptz,
  created_at          timestamptz not null default now()
);

create unique index if not exists wa_conversations_contact_uniq
  on wa_conversations(contact_id);

-- Every inbound and outbound message.
create table if not exists wa_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references wa_conversations(id) on delete cascade,
  wa_message_id   text unique,                       -- Meta's wamid, for dedup + status updates
  direction       text not null check (direction in ('in','out')),
  type            text not null default 'text',      -- text | image | document | audio | video | template
  body            text,
  media_url       text,                              -- re-hosted media (Supabase Storage / Cloudinary)
  status          text,                              -- received | sent | delivered | read | failed
  from_wa_id      text,
  to_wa_id        text,
  ts              timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists wa_messages_conversation_idx
  on wa_messages(conversation_id, ts);

-- Push live updates to the inbox UI without polling.
alter publication supabase_realtime add table wa_messages;
alter publication supabase_realtime add table wa_conversations;

-- RLS: the webhook/send routes use the service-role key (bypasses RLS).
-- The browser inbox reads with the anon/auth key, so lock reads to authenticated users.
alter table wa_contacts      enable row level security;
alter table wa_conversations enable row level security;
alter table wa_messages      enable row level security;

create policy "authenticated read contacts"      on wa_contacts      for select to authenticated using (true);
create policy "authenticated read conversations" on wa_conversations for select to authenticated using (true);
create policy "authenticated read messages"       on wa_messages      for select to authenticated using (true);
-- Writes happen only server-side via the service role, so no insert/update policies are granted to clients.
