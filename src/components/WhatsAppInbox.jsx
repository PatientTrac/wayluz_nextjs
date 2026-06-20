'use client';

// Reusable WhatsApp inbox with live translation.
//   - Reading language selector (top-left): the agent reads every message in
//     this language. English is the zero-cost default (uses the stored mirror).
//   - Replies are sent in the CUSTOMER's language (auto-detected per contact),
//     so a Spanish customer gets Spanish and an English one gets English.
// Branding via the `branding` prop: { logo, name, accent, bg }.

import { useEffect, useRef, useState, useCallback } from 'react';

// Reading-language code -> DeepL target code.
const DEEPL_TARGET = { EN: 'EN-US', ES: 'ES', PT: 'PT-PT', FR: 'FR', DE: 'DE', IT: 'IT' };
const LANG_LABEL = { EN: 'English', ES: 'Español', PT: 'Português', FR: 'Français', DE: 'Deutsch', IT: 'Italiano' };

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
  const [agentLang, setAgentLang] = useState('EN'); // the language the agent reads in
  const [replyLang, setReplyLang] = useState('ES');  // language replies are sent in
  const [tx, setTx] = useState({});                   // translation cache: `${id}:${lang}` -> text
  const endRef = useRef(null);

  // Restore the agent's saved reading language.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wa_agent_lang') : null;
    if (saved && DEEPL_TARGET[saved]) setAgentLang(saved);
  }, []);
  const changeAgentLang = (lang) => { setAgentLang(lang); try { localStorage.setItem('wa_agent_lang', lang); } catch (_) {} };

  const CONVO_COLS =
    'id, status, last_message_at, last_message_preview, window_expires_at, customer_lang, wa_contacts(name, wa_id)';

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

  // Default the reply language to the customer's detected language when switching threads.
  useEffect(() => {
    const cust = (active?.customer_lang || 'ES').toUpperCase().split('-')[0];
    setReplyLang(DEEPL_TARGET[cust] ? cust : 'ES');
  }, [activeId, active?.customer_lang]);

  // Translate inbound messages into the agent's reading language on demand (skipped for EN).
  useEffect(() => {
    if (agentLang === 'EN') return;
    const need = messages.filter((m) => m.body && !tx[`${m.id}:${agentLang}`]);
    if (need.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const target = DEEPL_TARGET[agentLang] || agentLang;
      const updates = {};
      for (const m of need) {
        try {
          const res = await fetch('/api/whatsapp/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: m.body, target }),
          });
          if (res.ok) updates[`${m.id}:${agentLang}`] = (await res.json()).text;
        } catch (_) { /* leave untranslated */ }
      }
      if (!cancelled && Object.keys(updates).length) setTx((prev) => ({ ...prev, ...updates }));
    })();
    return () => { cancelled = true; };
  }, [messages, agentLang, supabase, tx]);

  const display = (m) => {
    if (agentLang === 'EN') return m.body_en || m.body;
    return tx[`${m.id}:${agentLang}`] || m.body_en || m.body;
  };

  const send = useCallback(async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ to: active.wa_contacts.wa_id, body: draft.trim(), targetLang: DEEPL_TARGET[replyLang] || replyLang }),
      });
      if (res.ok) setDraft('');
      else alert((await res.json()).message || 'Send failed');
    } finally {
      setSending(false);
    }
  }, [draft, active, supabase, replyLang]);

  const windowOpen = active?.window_expires_at && new Date(active.window_expires_at) > new Date();
  const custLang = (active?.customer_lang || 'ES').toUpperCase().split('-')[0];
  const altLang = custLang === 'EN' ? 'ES' : 'EN';

  return (
    <div style={S.wrap}>
      <aside style={S.list}>
        <div style={S.brand}>
          {branding.logo || <span style={S.brandText}>{branding.name || 'WhatsApp'}</span>}
        </div>
        <div style={S.readRow}>
          <span style={S.readLabel}>Read in</span>
          <select value={agentLang} onChange={(e) => changeAgentLang(e.target.value)} style={S.select}>
            {Object.keys(DEEPL_TARGET).map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
          </select>
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
            <header style={S.threadHead}>
              <span>{active.wa_contacts?.name || active.wa_contacts?.wa_id}</span>
              {active.customer_lang && <span style={S.custBadge}>writes in {custLang}</span>}
            </header>
            <div style={S.messages}>
              {messages.map((m) => {
                const primary = display(m);
                const original = (primary && m.body && primary.trim() !== m.body.trim()) ? m.body : null;
                return (
                  <div key={m.id} style={{ ...S.bubble, ...(m.direction === 'out' ? S.out : S.in) }}>
                    <div>{primary}</div>
                    {original && (
                      <div style={S.translated}>
                        {(m.direction === 'out' ? 'sent' : 'original')}{m.lang ? ` · ${m.lang}` : ''}: {original}
                      </div>
                    )}
                    <div style={S.meta}>{new Date(m.ts).toLocaleTimeString()} {m.direction === 'out' ? `· ${m.status || ''}` : ''}</div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div style={S.composer}>
              {windowOpen ? (
                <>
                  <div style={S.langToggle}>
                    <button type="button" onClick={() => setReplyLang(custLang)}
                      style={{ ...S.langBtn, ...(replyLang === custLang ? S.langActive : {}) }}>{custLang}</button>
                    <button type="button" onClick={() => setReplyLang(altLang)}
                      style={{ ...S.langBtn, ...(replyLang === altLang ? S.langActive : {}) }}>{altLang}</button>
                  </div>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder={`Type your reply — sent in ${replyLang}…`} style={S.input} />
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
    readRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 10px' },
    readLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
    select: { flex: 1, background: '#16161a', color: '#eee', border: `1px solid ${hexToRgba(accent, 0.25)}`, borderRadius: 6, padding: '5px 6px', fontSize: 12 },
    convo: { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${hexToRgba(accent, 0.07)}`, padding: '12px 10px', cursor: 'pointer', color: '#eee' },
    convoActive: { background: hexToRgba(accent, 0.1) },
    convoName: { fontWeight: 600, fontSize: 14 },
    convoPreview: { fontSize: 12, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    empty: { color: '#777', fontSize: 13, padding: 10 },
    thread: { display: 'flex', flexDirection: 'column' },
    threadHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${hexToRgba(accent, 0.2)}`, fontWeight: 600, color: accent },
    custBadge: { fontSize: 11, color: '#888', fontWeight: 500, border: `1px solid ${hexToRgba(accent, 0.25)}`, borderRadius: 20, padding: '2px 8px' },
    messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
    bubble: { maxWidth: '70%', padding: '8px 12px', borderRadius: 12, fontSize: 14 },
    in: { alignSelf: 'flex-start', background: '#1d1d22' },
    out: { alignSelf: 'flex-end', background: hexToRgba(accent, 0.13), border: `1px solid ${hexToRgba(accent, 0.27)}` },
    translated: { fontSize: 12, color: '#9aa', marginTop: 5, paddingTop: 5, borderTop: '1px dashed rgba(255,255,255,0.12)', fontStyle: 'italic' },
    meta: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' },
    composer: { display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${hexToRgba(accent, 0.2)}`, alignItems: 'center' },
    langToggle: { display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1px solid ${hexToRgba(accent, 0.3)}` },
    langBtn: { background: 'transparent', color: '#aaa', border: 'none', padding: '0 12px', height: 38, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    langActive: { background: accent, color: bg },
    input: { flex: 1, background: '#16161a', border: `1px solid ${hexToRgba(accent, 0.2)}`, borderRadius: 8, padding: '10px 12px', color: '#eee' },
    sendBtn: { background: accent, color: bg, border: 'none', borderRadius: 8, padding: '0 18px', height: 38, fontWeight: 700, cursor: 'pointer' },
    closed: { color: '#c98b4b', fontSize: 13, margin: 0, padding: 8 },
    placeholder: { margin: 'auto', color: '#777' },
  };
}
