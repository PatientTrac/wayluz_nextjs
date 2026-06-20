-- Switch wa_config from Meta Cloud API fields to Twilio fields.
-- Adds the Twilio columns; the old Meta columns are left in place (harmless,
-- unused) so this migration is non-destructive and safe to run on existing data.

alter table wa_config
  add column if not exists account_sid    text,   -- Twilio Account SID (AC...)
  add column if not exists from_number    text,   -- WhatsApp From number, e.g. +14246224568
  add column if not exists auth_token_enc text;    -- AES-GCM ciphertext of the Twilio Auth Token
