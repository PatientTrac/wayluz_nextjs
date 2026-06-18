// /api/whatsapp/send  (POST)
// Body: { to: "573209937784", body: "Hola ..." }
// Auth: caller must present a valid Supabase session as a Bearer token.

import { NextResponse } from 'next/server';
import { sendText } from '@/lib/whatsapp/client';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req) {
  // --- AUTH: verify the caller's Supabase session -----------------------
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return new Response('Unauthorized', { status: 401 });

  const db = supabaseAdmin();
  const { data: auth, error: authErr } = await db.auth.getUser(token);
  if (authErr || !auth?.user) return new Response('Unauthorized', { status: 401 });

  // Optional: restrict to specific admins instead of any signed-in user.
  // const ALLOWED = (process.env.INBOX_ADMIN_EMAILS || '').split(',').map(s => s.trim());
  // if (ALLOWED.length && !ALLOWED.includes(auth.user.email)) {
  //   return new Response('Forbidden', { status: 403 });
  // }

  let to, body;
  try {
    ({ to, body } = await req.json());
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }
  if (!to || !body) return new Response('Missing to/body', { status: 400 });

  // Block free-text outside the 24h window (would need a template instead).
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

  let result;
  try {
    result = await sendText(to, body);
  } catch (err) {
    return NextResponse.json({ error: 'send_failed', detail: String(err) }, { status: 502 });
  }
  const wamid = result?.messages?.[0]?.id;

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
