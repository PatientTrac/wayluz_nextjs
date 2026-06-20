// /api/whatsapp/send (POST) — body { to, body }. Requires a signed-in user.
// Config (number/token) comes from the DB-backed config (env fallback).

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/whatsapp/adminAuth';
import { getWaConfig } from '@/lib/whatsapp/config';
import { createWhatsAppClient } from '@/lib/whatsapp/client';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req) {
  const user = await getSessionUser(req);
  if (!user) return new Response('Unauthorized', { status: 401 });

  let to, body;
  try { ({ to, body } = await req.json()); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (!to || !body) return new Response('Missing to/body', { status: 400 });

  const db = supabaseAdmin();

  const { data: contact } = await db.from('wa_contacts').select('id').eq('wa_id', to).single();
  if (contact) {
    const { data: convo } = await db.from('wa_conversations')
      .select('window_expires_at').eq('contact_id', contact.id).single();
    if (convo?.window_expires_at && new Date(convo.window_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'window_closed', message: 'Conversation is older than 24h — use a template to re-open.' },
        { status: 409 });
    }
  }

  let wa;
  try { wa = createWhatsAppClient(await getWaConfig()); }
  catch (e) { return NextResponse.json({ error: 'not_configured', detail: String(e) }, { status: 503 }); }

  let result;
  try { result = await wa.sendText(to, body); }
  catch (err) { return NextResponse.json({ error: 'send_failed', detail: String(err) }, { status: 502 }); }
  const wamid = result?.sid || null;

  const { data: c } = await db.from('wa_contacts').upsert({ wa_id: to }, { onConflict: 'wa_id' }).select().single();
  const now = new Date().toISOString();
  const { data: convo } = await db.from('wa_conversations')
    .upsert({ contact_id: c.id, status: 'open', last_message_at: now, last_message_preview: body.slice(0, 120) },
            { onConflict: 'contact_id' }).select().single();
  await db.from('wa_messages').insert({
    conversation_id: convo.id, wa_message_id: wamid, direction: 'out',
    type: 'text', body, status: 'sent', to_wa_id: to, ts: now,
  });

  return NextResponse.json({ ok: true, wamid });
}
