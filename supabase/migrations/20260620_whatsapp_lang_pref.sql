-- Remember each customer's language on the conversation so replies can be sent
-- back in the language they wrote in (detected from inbound messages).
alter table wa_conversations add column if not exists customer_lang text;
