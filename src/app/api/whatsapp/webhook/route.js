// /api/whatsapp/webhook — Twilio inbound messages + status callbacks.
// Twilio POSTs application/x-www-form-urlencoded and signs the request with
// your Auth Token (x-twilio-signature). We verify, then persist to the same
// wa_contacts / wa_conversations / wa_messages tables the inbox UI reads.

import { NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/whatsapp/verify';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { getWaConfig } from '@/lib/whatsapp/config';
import { translate, ADMIN_LANG } from '@/lib/whatsapp/translate';

export const runtime = 'nodejs';

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
      await handleInbound(db, params);
    }
  } catch (err) {
    console.error('[wa webhook]', err);
  }
  return twiml();
}

async function handleInbound(db, p) {
  const waId = (p.WaId || p.From || '').replace('whatsapp:', '').replace('+', '');
  if (!waId) return;
  const profileName = p.ProfileName || null;
  const businessNumber = (p.To || '').replace('whatsapp:', '');
  const numMedia = parseInt(p.NumMedia || '0', 10);
  const type = numMedia > 0 ? (p.MediaContentType0 || 'media').split('/')[0] : 'text';
  const body = p.Body || '';

  // Translate the customer's message to English for the agent. Non-blocking:
  // if DeepL is off or errors, body_en stays null and the UI shows the original.
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
    }, { onConflict: 'contact_id' })
    .select().single();

  await db.from('wa_messages').upsert({
    conversation_id: convo.id,
    wa_message_id: p.MessageSid || p.SmsMessageSid,
    direction: 'in', type, body, body_en, lang,
    media_url: numMedia > 0 ? (p.MediaUrl0 || null) : null,
    status: 'received', from_wa_id: waId, to_wa_id: businessNumber,
    ts: now.toISOString(),
  }, { onConflict: 'wa_message_id' });
}

async function handleStatus(db, p) {
  const sid = p.MessageSid || p.SmsSid;
  if (!sid) return;
  // Twilio statuses: queued | sent | delivered | read | failed | undelivered
  await db.from('wa_messages').update({ status: p.MessageStatus }).eq('wa_message_id', sid);
}
