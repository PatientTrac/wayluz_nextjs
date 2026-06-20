-- Stage 3: store both languages on every message.
--   body     = the text as it travels over WhatsApp (customer's language)
--   body_en  = English mirror (what the agent reads / typed)
--   lang     = language of `body` (e.g. 'ES', 'EN')
alter table wa_messages add column if not exists body_en text;
alter table wa_messages add column if not exists lang    text;
