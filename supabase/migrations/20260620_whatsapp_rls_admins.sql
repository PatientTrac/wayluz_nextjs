-- Stage 1 security: restrict WhatsApp chat reads from "any authenticated user"
-- to allowlisted admins only. Without this, anyone who signs in (including via
-- Google) becomes an `authenticated` user and could read every conversation
-- through the browser client. Webhook/send routes use the service role and
-- bypass RLS, so they are unaffected.

drop policy if exists "authenticated read contacts"      on wa_contacts;
drop policy if exists "authenticated read conversations" on wa_conversations;
drop policy if exists "authenticated read messages"      on wa_messages;

create policy "admins read contacts" on wa_contacts for select to authenticated
  using (exists (select 1 from app_admins a where lower(a.email) = lower(auth.jwt() ->> 'email')));

create policy "admins read conversations" on wa_conversations for select to authenticated
  using (exists (select 1 from app_admins a where lower(a.email) = lower(auth.jwt() ->> 'email')));

create policy "admins read messages" on wa_messages for select to authenticated
  using (exists (select 1 from app_admins a where lower(a.email) = lower(auth.jwt() ->> 'email')));
