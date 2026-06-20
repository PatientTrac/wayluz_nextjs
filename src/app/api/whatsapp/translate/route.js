// /api/whatsapp/translate (POST) — { text, target } -> { text, lang }.
// Used by the inbox to render inbound messages in the agent's chosen reading
// language on the fly. Requires a signed-in admin.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/whatsapp/adminAuth';
import { translate } from '@/lib/whatsapp/translate';

export const runtime = 'nodejs';

export async function POST(req) {
  const user = await getSessionUser(req);
  if (!user) return new Response('Unauthorized', { status: 401 });

  let text, target;
  try { ({ text, target } = await req.json()); } catch { return new Response('Bad JSON', { status: 400 }); }
  if (!text || !target) return NextResponse.json({ text: text || '', lang: null });

  const tr = await translate(text, target);
  return NextResponse.json({ text: tr ? tr.text : text, lang: tr?.detectedSourceLang || null });
}
