'use client';

// Reusable WhatsApp inbox. Branding is per-site via the `branding` prop:
//   branding = {
//     logo: <ReactNode>,   // e.g. your <Logo /> component or an <img/>
//     name: 'WayLuz',      // text fallback shown if no logo is given
//     accent: '#d4af37',   // brand color — drives every accent in the UI
//     bg: '#0d0d10',       // panel background
//   }
// Live updates via Supabase Realtime. Gate the page that renders this behind
// your existing admin auth.

import { useEffect, useRef, useState, useCallback } from 'react';

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function WhatsAppInbox({ supabase, branding = {} }) {
  const accent = branding.accent || '#d4af37';
  const bg = branding.bg || '#0d0d10';
  const S = makeStyles(accent, bg);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const CONVO_COLS =
    'id, status, last_message_at, last_message_preview, window_expires_at, wa_contacts(name, wa_id)';

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('wa_conversations').select(CONVO_COLS).order('last_message_at', { ascending: false });
      if (active) setConversations(data || []);
    };
    load();
    const ch = supabase
      .channel('wa_conversations_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_conversations' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [supabase]);

  useEffect(() => {
    if (!activeId) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from('wa_messages').select('*').eq('conversation_id', activeId).order('ts', { ascending: true });
      if (active) setMessages(data || []);
    })();
    const ch = supabase
      .channel(`wa_thread_${activeId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wa_messages', filter: `conversation_id=eq.${activeId}` },
        (p) => setMessages((prev) => [...prev, p.new]))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [activeId, supabase]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const active = conversations.find((c) => c.id === activeId);

  const send = useCallback(async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ to: active.wa_contacts.wa_id, body: draft.trim() }),
      });
      if (res.ok) setDraft('');
      else alert((await res.json()).message || 'Send failed');
    } finally {
      setSending(false);
    }
  }, [draft, active, supabase]);

  const windowOpen = active?.window_expires_at && new Date(active.window_expires_at) > new Date();

  return (
    <div style={S.wrap}>
      <aside style={S.list}>
        <div style={S.brand}>
          {branding.logo || <span style={S.brandText}>{branding.name || 'WhatsApp'}</span>}
        </div>
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            style={{ ...S.convo, ...(c.id === activeId ? S.convoActive : {}) }}>
            <div style={S.convoName}>{c.wa_contacts?.name || c.wa_contacts?.wa_id}</div>
            <div style={S.convoPreview}>{c.last_message_preview}</div>
          </button>
        ))}
        {conversations.length === 0 && <p style={S.empty}>No conversations yet.</p>}
      </aside>

      <section style={S.thread}>
        {active ? (
          <>
            <header style={S.threadHead}>{active.wa_contacts?.name || active.wa_contacts?.wa_id}</header>
            <div style={S.messages}>
              {messages.map((m) => (
                <div key={m.id} style={{ ...S.bubble, ...(m.direction === 'out' ? S.out : S.in) }}>
                  <div>{m.body}</div>
                  <div style={S.meta}>{new Date(m.ts).toLocaleTimeString()} {m.direction === 'out' ? `· ${m.status || ''}` : ''}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div style={S.composer}>
              {windowOpen ? (
                <>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Type a reply…" style={S.input} />
                  <button onClick={send} disabled={sending} style={S.sendBtn}>{sending ? '…' : 'Send'}</button>
                </>
              ) : (
                <p style={S.closed}>24h window closed — reopen with an approved template.</p>
              )}
            </div>
          </>
        ) : (
          <div style={S.placeholder}>Select a conversation</div>
        )}
      </section>
    </div>
  );
}

function makeStyles(accent, bg) {
  return {
    wrap: { display: 'grid', gridTemplateColumns: '230px 1fr', height: '80vh', border: `1px solid ${hexToRgba(accent, 0.2)}`, borderRadius: 12, overflow: 'hidden', background: bg, color: '#eee' },
    list: { borderRight: `1px solid ${hexToRgba(accent, 0.13)}`, overflowY: 'auto', padding: 8 },
    brand: { display: 'flex', alignItems: 'center', padding: '12px 10px 14px', borderBottom: `1px solid ${hexToRgba(accent, 0.13)}`, marginBottom: 6 },
    brandText: { color: accent, fontSize: 16, fontWeight: 700 },
    convo: { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${hexToRgba(accent, 0.07)}`, padding: '12px 10px', cursor: 'pointer', color: '#eee' },
    convoActive: { background: hexToRgba(accent, 0.1) },
    convoName: { fontWeight: 600, fontSize: 14 },
    convoPreview: { fontSize: 12, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    empty: { color: '#777', fontSize: 13, padding: 10 },
    thread: { display: 'flex', flexDirection: 'column' },
    threadHead: { padding: '14px 16px', borderBottom: `1px solid ${hexToRgba(accent, 0.2)}`, fontWeight: 600, color: accent },
    messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
    bubble: { maxWidth: '70%', padding: '8px 12px', borderRadius: 12, fontSize: 14 },
    in: { alignSelf: 'flex-start', background: '#1d1d22' },
    out: { alignSelf: 'flex-end', background: hexToRgba(accent, 0.13), border: `1px solid ${hexToRgba(accent, 0.27)}` },
    meta: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' },
    composer: { display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${hexToRgba(accent, 0.2)}` },
    input: { flex: 1, background: '#16161a', border: `1px solid ${hexToRgba(accent, 0.2)}`, borderRadius: 8, padding: '10px 12px', color: '#eee' },
    sendBtn: { background: accent, color: bg, border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 700, cursor: 'pointer' },
    closed: { color: '#c98b4b', fontSize: 13, margin: 0, padding: 8 },
    placeholder: { margin: 'auto', color: '#777' },
  };
}
