// /api/whatsapp/config — admin only.
//   GET  -> operational fields + booleans token_set / app_secret_set (never the secret values)
//   POST -> upsert config; secret fields are encrypted; blank secret = keep existing

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
    phone_number_id: r.phone_number_id || '',
    waba_id: r.waba_id || '',
    graph_version: r.graph_version || 'v23.0',
    verify_token: r.verify_token || '',
    token_set: !!r.token_enc,
    app_secret_set: !!r.app_secret_enc,
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
    phone_number_id: b.phone_number_id ?? null,
    waba_id: b.waba_id ?? null,
    graph_version: b.graph_version || 'v23.0',
    verify_token: b.verify_token ?? null,
    updated_at: new Date().toISOString(),
    updated_by: gate.user.email,
  };

  // Only overwrite secrets when a non-empty value is supplied.
  if (b.token) update.token_enc = encryptSecret(b.token);
  if (b.app_secret) update.app_secret_enc = encryptSecret(b.app_secret);

  const { error } = await supabaseAdmin().from('wa_config').upsert(update, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: String(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
