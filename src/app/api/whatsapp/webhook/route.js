// /api/whatsapp/webhook  — GET verify handshake + POST inbound events.
// Reads verify token + app secret from the DB-backed config (env fallback).

import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/whatsapp/verify';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { getWaConfig } from '@/lib/whatsapp/config';
import { createWhatsAppClient } from '@/lib/whatsapp/client';

export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const cfg = await getWaConfig();
  if (mode === 'subscribe' && token && token === cfg.verifyToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get('x-hub-signature-256');
  const cfg = await getWaConfig();

  if (!verifySignature(raw, sig, cfg.appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const db = supabaseAdmin();
  let wa = null;
  try { wa = createWhatsAppClient(cfg); } catch { /* config incomplete; skip read receipts */ }

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        await handleInbound(db, wa, value);
        await handleStatuses(db, value);
      }
    }
  } catch (err) {
    console.error('[wa webhook]', err);
  }
  return NextResponse.json({ received: true });
}

async function handleInbound(db, wa, value) {
  const messages = value.messages;
  if (!messages?.length) return;
  const profileName = value.contacts?.[0]?.profile?.name || null;
  const businessNumber = value.metadata?.display_phone_number || null;

  for (const m of messages) {
    const waId = m.from;
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
        last_message_at: now.toISOString(), last_message_preview: previewOf(m),
        window_expires_at: windowExpires,
      }, { onConflict: 'contact_id' })
      .select().single();

    await db.from('wa_messages').upsert({
      conversation_id: convo.id, wa_message_id: m.id, direction: 'in',
      type: m.type, body: textOf(m), status: 'received',
      from_wa_id: waId, to_wa_id: businessNumber,
      ts: new Date(Number(m.timestamp) * 1000).toISOString(),
    }, { onConflict: 'wa_message_id' });

    if (wa) wa.markRead(m.id).catch(() => {});
  }
}

async function handleStatuses(db, value) {
  const statuses = value.statuses;
  if (!statuses?.length) return;
  for (const s of statuses) {
    await db.from('wa_messages').update({ status: s.status }).eq('wa_message_id', s.id);
  }
}

function textOf(m) {
  if (m.type === 'text') return m.text?.body || '';
  if (m.type === 'image') return m.image?.caption || '';
  if (m.type === 'document') return m.document?.filename || '';
  if (m.type === 'button') return m.button?.text || '';
  if (m.type === 'interactive') return m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '';
  return '';
}
function previewOf(m) { const t = textOf(m); return t ? t.slice(0, 120) : `[${m.type}]`; }
