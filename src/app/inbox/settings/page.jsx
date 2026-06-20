'use client';

// Admin-only WhatsApp settings (Twilio). Enter the number + Twilio credentials
// here instead of env vars. The Auth Token is write-only from the browser's
// perspective: sent once, encrypted server-side, never read back (the form
// shows only "set / not set").
//
// Gated by ProtectedRoute AND a server-side admin check (the API returns 403
// for non-admins). Adjust the two imports to your repo's paths if they differ.

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/customSupabaseClient';
import Logo from '@/components/Logo';

const FIELDS = [
  ['display_name', 'Display name', 'WayLuz Inversion'],
  ['display_number', 'Phone number (shown in UI)', '+1 (424) 622-4568'],
  ['from_number', 'Twilio WhatsApp From number', '+14246224568'],
  ['account_sid', 'Twilio Account SID', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
];

function SettingsForm() {
  const [form, setForm] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [status, setStatus] = useState('');
  const [forbidden, setForbidden] = useState(false);

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ''}` };
  }

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/whatsapp/config', { headers: await authHeader() });
      if (res.status === 403) { setForbidden(true); return; }
      if (res.ok) setForm(await res.json());
    })();
  }, []);

  if (forbidden) return <p style={S.note}>You don't have permission to edit these settings.</p>;
  if (!form) return <p style={S.note}>Loading…</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    setStatus('Saving…');
    const body = { ...form };
    if (authToken) body.auth_token = authToken;
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(body),
    });
    if (res.ok) { setStatus('Saved.'); setAuthToken('');
      const r = await fetch('/api/whatsapp/config', { headers: await authHeader() });
      if (r.ok) setForm(await r.json());
    } else setStatus('Save failed.');
  }

  return (
    <div style={S.wrap}>
      <div style={{ marginBottom: 18 }}><Logo showText className="h-9 w-9" /></div>
      <h1 style={S.h1}>WhatsApp settings</h1>
      {FIELDS.map(([k, label, ph]) => (
        <label key={k} style={S.row}>
          <span style={S.label}>{label}</span>
          <input style={S.input} value={form[k] || ''} placeholder={ph} onChange={set(k)} />
        </label>
      ))}

      <label style={S.row}>
        <span style={S.label}>Twilio Auth Token {form.auth_token_set && <em style={S.set}>· set</em>}</span>
        <input style={S.input} type="password" value={authToken}
          placeholder={form.auth_token_set ? '•••••••• (leave blank to keep)' : 'paste Auth Token'}
          onChange={(e) => setAuthToken(e.target.value)} />
      </label>

      <div style={S.actions}>
        <button style={S.btn} onClick={save}>Save</button>
        <span style={S.status}>{status}</span>
      </div>
    </div>
  );
}

export default function WhatsAppSettingsPage() {
  return (<ProtectedRoute><SettingsForm /></ProtectedRoute>);
}

const GOLD = '#d4af37';
const S = {
  wrap: { maxWidth: 560, margin: '24px auto', padding: 24, background: '#0d0d10', color: '#eee', border: `1px solid ${GOLD}33`, borderRadius: 12 },
  h1: { color: GOLD, fontSize: 20, fontWeight: 500, margin: '0 0 20px' },
  row: { display: 'block', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, color: '#bbb', marginBottom: 6 },
  set: { color: GOLD, fontStyle: 'normal' },
  input: { width: '100%', background: '#16161a', border: `1px solid ${GOLD}33`, borderRadius: 8, padding: '10px 12px', color: '#eee', boxSizing: 'border-box' },
  actions: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 },
  btn: { background: GOLD, color: '#0d0d10', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' },
  status: { color: '#9c9', fontSize: 13 },
  note: { color: '#aaa', textAlign: 'center', marginTop: 40 },
};
