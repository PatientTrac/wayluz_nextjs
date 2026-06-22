import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { sendSalesLead, sendVisitorAutoReply } from '@/lib/email';

export const dynamic = 'force-dynamic';

const emailRegex = /\S+@\S+\.\S+/;
const phoneRegex = /^\+?[\d\s-]{8,}$/;

function sanitizeString(value, maxLength = 2000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = sanitizeString(body.name, 200);
  const email = sanitizeString(body.email, 320);
  const phone = sanitizeString(body.phone, 80);
  const propertyInterest = sanitizeString(body.propertyInterest, 300);
  const message = sanitizeString(body.message, 5000);

  if (!name) return Response.json({ error: 'Name is required.' }, { status: 400 });
  if (!email || !emailRegex.test(email))
    return Response.json({ error: 'A valid email is required.' }, { status: 400 });
  if (phone && !phoneRegex.test(phone))
    return Response.json({ error: 'Invalid phone number format.' }, { status: 400 });
  if (!message) return Response.json({ error: 'Message is required.' }, { status: 400 });

  const userAgent = request.headers.get('user-agent') || null;

  // 1) Email the sales team (the actual deliverable).
  const lead = await sendSalesLead({
    channel: 'website',
    name,
    email,
    phone,
    propertyInterest,
    message,
    userAgent,
  });

  // 2) Auto-reply to the visitor (asks which property + links /properties).
  const autoReply = await sendVisitorAutoReply({ to: email, name, propertyInterest });

  // 3) Best-effort Supabase save. NEVER blocks the lead.
  let dbSaved = false;
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('contact_submissions').insert({
      name,
      email,
      phone: phone || null,
      property_interest: propertyInterest || null,
      message,
      source: 'wayluz.com',
      user_agent: userAgent,
    });
    if (error) console.error('[contact route] Supabase insert failed (non-fatal):', error);
    else dbSaved = true;
  } catch (err) {
    console.error('[contact route] Supabase unavailable (non-fatal):', err);
  }

  // Success if the lead reached us by ANY channel.
  if (!lead.sent && !dbSaved) {
    console.error('[contact route] All channels failed.', { lead: lead.reason });
    return Response.json(
      { error: 'We could not deliver your message right now. Please email sales@wayluz.com directly.' },
      { status: 502 }
    );
  }
  if (!lead.sent) console.warn('[contact route] lead email not sent:', lead.reason);
  if (!autoReply.sent) console.warn('[contact route] auto-reply not sent:', autoReply.reason);

  return Response.json(
    { ok: true, emailed: lead.sent, autoReplied: autoReply.sent, saved: dbSaved },
    { status: 201 }
  );
}
