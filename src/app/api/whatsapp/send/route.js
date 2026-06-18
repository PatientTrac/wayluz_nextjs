// /api/whatsapp/send  (POST)
// Body: { to: "573209937784", body: "Hola ..." }
//
// Sends a free-text reply via the Cloud API and records it in the inbox.
// Guarded so only your logged-in agents can call it.

import { NextResponse } from 'next/server';
import { sendText } from '@/lib/whatsapp/client';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req) {
  // --- AUTH GATE ---------------------------------------------------------
  // Replace with your project's real check. On WayLuz, verify the Supabase
  // auth session (the logged-in admin). Quick stop-gap: a shared header secret.
  const authed = req.headers.get('x-inbox-secret') === process.env.INBOX_API_SECRET;
  if (!authed) return new Response('Unauthorized', { status: 401 });

  let to, body;
  try {
    ({ to, body } = await req.json());
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  if (!to || !body) return new Response('Missing to/body', { status: 400 });

  const db = supabaseAdmin();

  // Optional: block free-text outside the 24h window (would need a template instead).
  const { data: contact } = await db.from('wa_contacts').select('id').eq('wa_id', to).single();
  if (contact) {
    const { data: convo } = await db
      .from('wa_conversations')
      .select('window_expires_at')
      .eq('contact_id', contact.id)
      .single();
    if (convo?.window_expires_at && new Date(convo.window_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'window_closed', message: 'Conversation is older than 24h — use a template to re-open.' },
        { status: 409 }
      );
    }
  }

  // Send via Meta
  let result;
  try {
    result = await sendText(to, body);
  } catch (err) {
    return NextResponse.json({ error: 'send_failed', detail: String(err) }, { status: 502 });
  }
  const wamid = result?.messages?.[0]?.id;

  // Persist outbound (mirror the contact/conversation upsert so the thread updates live)
  const { data: c } = await db
    .from('wa_contacts')
    .upsert({ wa_id: to }, { onConflict: 'wa_id' })
    .select()
    .single();

  const now = new Date().toISOString();
  const { data: convo } = await db
    .from('wa_conversations')
    .upsert(
      { contact_id: c.id, status: 'open', last_message_at: now, last_message_preview: body.slice(0, 120) },
      { onConflict: 'contact_id' }
    )
    .select()
    .single();

  await db.from('wa_messages').insert({
    conversation_id: convo.id,
    wa_message_id: wamid,
    direction: 'out',
    type: 'text',
    body,
    status: 'sent',
    to_wa_id: to,
    ts: now,
  });

  return NextResponse.json({ ok: true, wamid });
}
