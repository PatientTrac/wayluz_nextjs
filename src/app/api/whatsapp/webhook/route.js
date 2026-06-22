// /api/whatsapp/webhook — Twilio inbound messages + status callbacks.
// Twilio POSTs application/x-www-form-urlencoded and signs the request with
// your Auth Token (x-twilio-signature). We verify, then persist to the same
// wa_contacts / wa_conversations / wa_messages tables the inbox UI reads.
//
// AUTO-REPLY: on a customer's FIRST message in a conversation we (1) reply on
// WhatsApp asking which property they want + link wayluz.com/properties, and
// (2) email the sales team. Both are best-effort and never block the 200 we
// must return to Twilio.

import { verifyTwilioSignature } from '@/lib/whatsapp/verify';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { getWaConfig } from '@/lib/whatsapp/config';
import { createWhatsAppClient } from '@/lib/whatsapp/client';
import { translate, ADMIN_LANG } from '@/lib/whatsapp/translate';
import { sendSalesLead, PROPERTIES_URL, SALES_EMAIL } from '@/lib/email';

export const runtime = 'nodejs';

const AUTO_REPLY_ENABLED = (process.env.WA_AUTOREPLY_ENABLED || 'true') !== 'false';

// Bilingual (ES first — leads are Colombia-based) auto-reply. Override with env.
const AUTO_REPLY_TEXT =
  process.env.WA_AUTOREPLY_TEXT ||
  `¡Hola! Gracias por contactar a WayLuz. ¿Sobre cuál propiedad desea información? ` +
    `Vea todas nuestras propiedades con detalles y precios aquí: ${PROPERTIES_URL} ` +
    `— Para más información escríbanos a ${SALES_EMAIL}.\n\n` +
    `Hi! Thanks for contacting WayLuz. Which property would you like information about? ` +
    `See all our properties with details and pricing here: ${PROPERTIES_URL} ` +
    `— For more info, email ${SALES_EMAIL}.`;

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
function twiml() {
  return new Response(TWIML_OK, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

// Optional health check. Twilio does NOT do a GET verification handshake.
export async function GET() {
  return new Response('OK', { status: 200 });
}

export async function POST(req) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));
  const cfg = await getWaConfig();

  // Reconstruct the exact public URL Twilio signed. This MUST match the webhook
  // URL set in the Twilio console (e.g. https://wayluz.com/api/whatsapp/webhook,
  // no trailing slash).
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const url = `${proto}://${host}/api/whatsapp/webhook`;
  const sig = req.headers.get('x-twilio-signature');

  if (cfg.authToken) {
    if (!verifyTwilioSignature(cfg.authToken, url, params, sig)) {
      return new Response('Invalid signature', { status: 403 });
    }
  } else {
    console.warn('[wa webhook] no Auth Token configured yet — skipping signature check');
  }

  const db = supabaseAdmin();
  try {
    if (params.MessageStatus) {
      await handleStatus(db, params);
    } else if (params.From) {
      await handleInbound(db, params, cfg);
    }
  } catch (err) {
    console.error('[wa webhook]', err);
  }
  return twiml();
}

async function handleInbound(db, p, cfg) {
  const waId = (p.WaId || p.From || '').replace('whatsapp:', '').replace('+', '');
  if (!waId) return;
  const profileName = p.ProfileName || null;
  const businessNumber = (p.To || '').replace('whatsapp:', '');
  const numMedia = parseInt(p.NumMedia || '0', 10);
  const type = numMedia > 0 ? (p.MediaContentType0 || 'media').split('/')[0] : 'text';
  const body = p.Body || '';

  // Translate the customer's message to English for the agent. Non-blocking.
  let body_en = null, lang = null;
  if (type === 'text' && body.trim()) {
    const tr = await translate(body, ADMIN_LANG);
    if (tr) { body_en = tr.text; lang = tr.detectedSourceLang; }
  }
  const preview = (body_en || body || `[${type}]`).slice(0, 120);

  const { data: contact } = await db
    .from('wa_contacts')
    .upsert({ wa_id: waId, name: profileName, updated_at: new Date().toISOString() }, { onConflict: 'wa_id' })
    .select().single();

  const now = new Date();
  const windowExpires = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const { data: convo } = await db
    .from('wa_conversations')
    .upsert({
      contact_id: contact.id, status: 'open',
      last_message_at: now.toISOString(),
      last_message_preview: preview,
      window_expires_at: windowExpires,
      ...(lang ? { customer_lang: lang } : {}),
    }, { onConflict: 'contact_id' })
    .select().single();

  // Is this the customer's FIRST message in this conversation? Count BEFORE the
  // insert so a Twilio retry of the same MessageSid can't trigger a 2nd reply.
  const { count: priorCount } = await db
    .from('wa_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', convo.id);
  const isFirstContact = (priorCount || 0) === 0;

  await db.from('wa_messages').upsert({
    conversation_id: convo.id,
    wa_message_id: p.MessageSid || p.SmsMessageSid,
    direction: 'in', type, body, body_en, lang,
    media_url: numMedia > 0 ? (p.MediaUrl0 || null) : null,
    status: 'received', from_wa_id: waId, to_wa_id: businessNumber,
    ts: now.toISOString(),
  }, { onConflict: 'wa_message_id' });

  if (AUTO_REPLY_ENABLED && isFirstContact) {
    await sendAutoReply(db, { waId, profileName, body, convoId: convo.id, cfg });
  }
}

// Fires once, on first contact: WhatsApp reply + sales email. Never throws.
async function sendAutoReply(db, { waId, profileName, body, convoId, cfg }) {
  // 1) WhatsApp reply (free-form, valid inside the 24h window the inbound msg opened).
  try {
    const wa = createWhatsAppClient(cfg);
    const result = await wa.sendText(waId, AUTO_REPLY_TEXT);
    await db.from('wa_messages').insert({
      conversation_id: convoId,
      wa_message_id: result?.sid || null,
      direction: 'out', type: 'text',
      body: AUTO_REPLY_TEXT, body_en: AUTO_REPLY_TEXT, lang: 'ES',
      status: 'sent', to_wa_id: waId, ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[wa webhook] auto-reply send failed (non-fatal):', err);
  }

  // 2) Sales lead email via the shared Resend function.
  try {
    const res = await sendSalesLead({
      channel: 'whatsapp',
      name: profileName,
      waId,
      message: body,
    });
    if (!res.sent) console.warn('[wa webhook] sales email not sent:', res.reason);
  } catch (err) {
    console.error('[wa webhook] sales email failed (non-fatal):', err);
  }
}

async function handleStatus(db, p) {
  const sid = p.MessageSid || p.SmsSid;
  if (!sid) return;
  // Twilio statuses: queued | sent | delivered | read | failed | undelivered
  await db.from('wa_messages').update({ status: p.MessageStatus }).eq('wa_message_id', sid);
}
