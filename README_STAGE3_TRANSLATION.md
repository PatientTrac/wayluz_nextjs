# Stage 3 — DeepL translation in the inbox

Inbound customer messages (Spanish) are shown to the agent in English; the agent
types replies in English and the customer receives them in Spanish. Both versions
are stored on every message.

## Files
| File | Path | Change |
|---|---|---|
| translate.js | src/lib/whatsapp/ | NEW — DeepL helper (free or pro key auto-detected) |
| webhook/route.js | src/app/api/whatsapp/ | translate inbound → English, store body_en + lang |
| send/route.js | src/app/api/whatsapp/ | translate agent English → Spanish, send Spanish, store both |
| WhatsAppInbox.jsx | src/components/ | shows English on top, original/sent text muted below |
| 20260620_whatsapp_translation.sql | supabase/migrations/ | adds body_en + lang columns |

## Install
1. Drop the files into place.
2. Run `20260620_whatsapp_translation.sql` in the Supabase SQL editor.
3. Add the DeepL key to **Netlify → Site config → Environment variables**:
   `DEEPL_API_KEY = <your key>` (free-tier keys end in `:fx`). Optionally
   `WA_CUSTOMER_LANG` (default ES) and `WA_ADMIN_LANG` (default EN-US).
4. Commit + push, then redeploy so the new env var is picked up.

## Data model
- `body` — the text as it travels over WhatsApp (customer's language).
- `body_en` — English mirror (what the agent reads, or typed before sending).
- `lang` — language of `body` (e.g. ES, EN).

## Behaviour
- **Inbound:** customer's Spanish saved as `body`; English translation saved as
  `body_en`; the inbox shows English with the Spanish original muted underneath.
- **Outbound:** agent types English; it's translated to Spanish, the Spanish is
  what's actually delivered (`body`), and the English is kept as `body_en`.
- **Graceful fallback:** if the key is missing or DeepL errors, messages still
  send/save — just untranslated (you'll see only the original text).

## Notes
- DeepL never blocks message delivery; a translation failure logs and falls back.
- Free tier is 500k chars/month — plenty for a support inbox. Watch usage in the
  DeepL dashboard.
- To support a different customer language later, change `WA_CUSTOMER_LANG`.
