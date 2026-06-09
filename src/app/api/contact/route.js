import { createSupabaseServerClient } from '@/lib/supabase/serverClient';

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

  if (!name) {
    return Response.json({ error: 'Name is required.' }, { status: 400 });
  }

  if (!email || !emailRegex.test(email)) {
    return Response.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  if (phone && !phoneRegex.test(phone)) {
    return Response.json({ error: 'Invalid phone number format.' }, { status: 400 });
  }

  if (!message) {
    return Response.json({ error: 'Message is required.' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    phone: phone || null,
    property_interest: propertyInterest || null,
    message,
    source: 'wayluz.com',
    user_agent: request.headers.get('user-agent') || null,
  });

  if (error) {
    console.error('[contact route] Supabase insert failed:', error);
    return Response.json({ error: 'Unable to save contact submission.' }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
