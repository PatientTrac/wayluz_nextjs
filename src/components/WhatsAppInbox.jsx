'use client';

// Reusable WhatsApp inbox: conversation list + thread + composer.
// Live updates via Supabase Realtime (no polling). Gate the PAGE that renders
// this behind your existing admin auth (e.g. WayLuz <ProtectedRoute>).
//
// Drop-in: import WhatsAppInbox from '@/components/WhatsAppInbox';
// Provide a configured browser supabase client via the `supabase` prop, or
// adjust the import below to your project's client.

import { useEffect, useRef, useState, useCallback } from 'react';

export default function WhatsAppInbox({ supabase }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // initial load + realtime for the conversation list
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('wa_conversations')
        .select('id, status, last_message_at, last_message_preview, window_expires_at, wa_contacts(name, wa_id)')
        .order('last_message_at', { ascending: false });
      if (active) setConversations(data || []);
    })();

    const ch = supabase
      .channel('wa_conversations_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_conversations' }, async () => {
        const { data } = await supabase
          .from('wa_conversations')
          .select('id, status, last_message_at, last_message_preview, window_expires_at, wa_contacts(name, wa_id)')
          .order('last_message_at', { ascending: false });
        setConversations(data || []);
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [supabase]);

  // load + realtime for the open thread
  useEffect(() => {
    if (!activeId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('wa_messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('ts', { ascending: true });
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
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
      {/* conversation list */}
      <aside style={S.list}>
        <h2 style={S.listTitle}>WhatsApp</h2>
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            style={{ ...S.convo, ...(c.id === activeId ? S.convoActive : {}) }}>
            <div style={S.convoName}>{c.wa_contacts?.name || c.wa_contacts?.wa_id}</div>
            <div style={S.convoPreview}>{c.last_message_preview}</div>
          </button>
        ))}
        {conversations.length === 0 && <p style={S.empty}>No conversations yet.</p>}
      </aside>

      {/* thread */}
      <section style={S.thread}>
        {active ? (
          <>
            <header style={S.threadHead}>
              {active.wa_contacts?.name || active.wa_contacts?.wa_id}
            </header>
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
                  <button onClick={send} disabled={sending} style={S.sendBtn}>
                    {sending ? '…' : 'Send'}
                  </button>
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

// WayLuz gold/dark theme (inline so the component is portable across projects)
const GOLD = '#C9A24B';
const S = {
  wrap: { display: 'grid', gridTemplateColumns: '320px 1fr', height: '80vh', border: `1px solid ${GOLD}33`, borderRadius: 12, overflow: 'hidden', background: '#0d0d10', color: '#eee' },
  list: { borderRight: `1px solid ${GOLD}22`, overflowY: 'auto', padding: 8 },
  listTitle: { color: GOLD, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 10px' },
  convo: { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${GOLD}11`, padding: '12px 10px', cursor: 'pointer', color: '#eee' },
  convoActive: { background: `${GOLD}1a` },
  convoName: { fontWeight: 600, fontSize: 14 },
  convoPreview: { fontSize: 12, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  empty: { color: '#777', fontSize: 13, padding: 10 },
  thread: { display: 'flex', flexDirection: 'column' },
  threadHead: { padding: '14px 16px', borderBottom: `1px solid ${GOLD}22`, fontWeight: 600, color: GOLD },
  messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  bubble: { maxWidth: '70%', padding: '8px 12px', borderRadius: 12, fontSize: 14 },
  in: { alignSelf: 'flex-start', background: '#1d1d22' },
  out: { alignSelf: 'flex-end', background: `${GOLD}22`, border: `1px solid ${GOLD}44` },
  meta: { fontSize: 10, color: '#888', marginTop: 4, textAlign: 'right' },
  composer: { display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${GOLD}22` },
  input: { flex: 1, background: '#16161a', border: `1px solid ${GOLD}33`, borderRadius: 8, padding: '10px 12px', color: '#eee' },
  sendBtn: { background: GOLD, color: '#0d0d10', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 700, cursor: 'pointer' },
  closed: { color: '#c98b4b', fontSize: 13, margin: 0, padding: 8 },
  placeholder: { margin: 'auto', color: '#777' },
};
