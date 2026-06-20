// /api/whatsapp/config — admin only.
//   GET  -> operational fields + boolean auth_token_set (never the token value)
//   POST -> upsert config; the Auth Token is encrypted; blank token = keep existing

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/whatsapp/adminAuth';
import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';
import { encryptSecret } from '@/lib/whatsapp/crypto';

export const runtime = 'nodejs';

export async function GET(req) {
  const gate = await requireAdmin(req);
  if (gate.error) return new Response(gate.error, { status: gate.status });

  const { data } = await supabaseAdmin().from('wa_config').select('*').eq('id', 1).maybeSingle();
  const r = data || {};
  return NextResponse.json({
    display_name: r.display_name || '',
    display_number: r.display_number || '',
    from_number: r.from_number || '',
    account_sid: r.account_sid || '',
    auth_token_set: !!r.auth_token_enc,
  });
}

export async function POST(req) {
  const gate = await requireAdmin(req);
  if (gate.error) return new Response(gate.error, { status: gate.status });

  let b;
  try { b = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const update = {
    id: 1,
    display_name: b.display_name ?? null,
    display_number: b.display_number ?? null,
    from_number: b.from_number ?? null,
    account_sid: b.account_sid ?? null,
    updated_at: new Date().toISOString(),
    updated_by: gate.user.email,
  };

  // Only overwrite the Auth Token when a non-empty value is supplied.
  if (b.auth_token) update.auth_token_enc = encryptSecret(b.auth_token);

  const { error } = await supabaseAdmin().from('wa_config').upsert(update, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: String(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
