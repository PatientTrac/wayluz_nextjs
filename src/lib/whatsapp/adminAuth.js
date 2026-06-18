// Auth helpers for the API routes.
// getSessionUser  -> any signed-in Supabase user (can use the inbox / send)
// requireAdmin    -> signed-in AND listed in app_admins (can edit credentials)

import { supabaseAdmin } from '@/lib/whatsapp/supabaseAdmin';

export async function getSessionUser(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function isAdmin(email) {
  if (!email) return false;
  const { data } = await supabaseAdmin()
    .from('app_admins')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

export async function requireAdmin(req) {
  const user = await getSessionUser(req);
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!(await isAdmin(user.email))) return { error: 'Forbidden', status: 403 };
  return { user };
}
