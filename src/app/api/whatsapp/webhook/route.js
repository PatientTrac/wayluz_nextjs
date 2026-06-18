// /api/whatsapp/webhook
//   GET  -> Meta's subscription verification handshake
//   POST -> inbound messages + status updates from Meta
//
// Register this URL in your Meta app: WhatsApp > Configuration > Callback URL
//   https://<your-project-domain>/api/whatsapp/webhook
//   Verify token: must match WHATSAPP_VERIFY_TOKEN

import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/whatsapp/verify';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { markRead } from '@/lib/whatsapp/client';

export const runtime = 'nodejs'; // need raw body + crypto

// --- GET: verification handshake -------------------------------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// --- POST: inbound events ---------------------------------------------------
export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get('x-hub-signature-256');

  if (!verifySignature(raw, sig, process.env.WHATSAPP_APP_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const db = supabaseAdmin();

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        await handleInboundMessages(db, value);
        await handleStatusUpdates(db, value);
      }
    }
  } catch (err) {
    // Log but still 200 so Meta doesn't hammer retries for a transient DB blip.
    console.error('[wa webhook]', err);
  }

  // Always 200 quickly; Meta retries for 7 days on non-200.
  return NextResponse.json({ received: true });
}

async function handleInboundMessages(db, value) {
  const messages = value.messages;
  if (!messages?.length) return;

  const profileName = value.contacts?.[0]?.profile?.name || null;
  const businessNumber = value.metadata?.display_phone_number || null;

  for (const m of messages) {
    const waId = m.from;

    // 1) upsert contact
    const { data: contact } = await db
      .from('wa_contacts')
      .upsert({ wa_id: waId, name: profileName, updated_at: new Date().toISOString() },
              { onConflict: 'wa_id' })
      .select()
      .single();

    // 2) upsert conversation, refresh the 24h window
    const now = new Date();
    const windowExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const preview = previewOf(m);

    const { data: convo } = await db
      .from('wa_conversations')
      .upsert(
        {
          contact_id: contact.id,
          status: 'open',
          last_message_at: now.toISOString(),
          last_message_preview: preview,
          window_expires_at: windowExpires,
        },
        { onConflict: 'contact_id' }
      )
      .select()
      .single();

    // 3) insert the message (dedup on wa_message_id)
    await db.from('wa_messages').upsert(
      {
        conversation_id: convo.id,
        wa_message_id: m.id,
        direction: 'in',
        type: m.type,
        body: textOf(m),
        status: 'received',
        from_wa_id: waId,
        to_wa_id: businessNumber,
        ts: new Date(Number(m.timestamp) * 1000).toISOString(),
      },
      { onConflict: 'wa_message_id' }
    );

    // 4) blue ticks (best-effort)
    markRead(m.id).catch(() => {});
  }
}

async function handleStatusUpdates(db, value) {
  const statuses = value.statuses;
  if (!statuses?.length) return;
  for (const s of statuses) {
    await db
      .from('wa_messages')
      .update({ status: s.status })
      .eq('wa_message_id', s.id);
  }
}

function textOf(m) {
  if (m.type === 'text') return m.text?.body || '';
  if (m.type === 'image') return m.image?.caption || '';
  if (m.type === 'document') return m.document?.filename || '';
  if (m.type === 'button') return m.button?.text || '';
  if (m.type === 'interactive')
    return m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '';
  return '';
}

function previewOf(m) {
  const t = textOf(m);
  if (t) return t.slice(0, 120);
  return `[${m.type}]`;
}
