'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Search, Loader2 } from 'lucide-react';

type Thread = { id: string; child_id: string; child_name: string; last_msg_at: string };
type Msg = { id: string; sender_type: 'leder' | 'companion'; sender_name: string; body: string; created_at: string };

export function LederInbox() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filtered, setFiltered] = useState<Thread[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const staffName = typeof window !== 'undefined' ? localStorage.getItem('staffName') ?? 'Leder' : 'Leder';

  const loadThreads = useCallback(async () => {
    const { data: children } = await supabase.from('children').select('id, name').order('name');
    const { data: threadRows } = await supabase.from('inbox_threads').select('id, child_id, last_msg_at');
    const seen = localStorage.getItem('inboxSeenAt') ?? new Date(0).toISOString();

    const threadMap = new Map((threadRows ?? []).map((t: { id: string; child_id: string; last_msg_at: string }) => [t.child_id, t]));
    const rows: Thread[] = ((children ?? []) as { id: string; name: string }[]).map(c => {
      const t = threadMap.get(c.id) as { id: string; last_msg_at: string } | undefined;
      return { id: t?.id ?? '', child_id: c.id, child_name: c.name, last_msg_at: t?.last_msg_at ?? '' };
    });

    // check unread
    const { data: newMsgs } = await supabase
      .from('inbox_messages').select('thread_id')
      .eq('sender_type', 'companion').gt('created_at', seen);
    const unreadThreads = new Set((newMsgs ?? []).map((m: { thread_id: string }) => m.thread_id));
    setUnread(unreadThreads);
    setThreads(rows);
    setFiltered(rows);
    setLoading(false);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? threads.filter(t => t.child_name.toLowerCase().includes(q)) : threads);
  }, [search, threads]);

  const openThread = useCallback(async (t: Thread) => {
    setActive(t);
    setUnread(prev => { const n = new Set(prev); n.delete(t.id); return n; });
    localStorage.setItem('inboxSeenAt', new Date().toISOString());

    let threadId = t.id;
    if (!threadId) {
      const { data: created } = await supabase
        .from('inbox_threads').insert({ child_id: t.child_id }).select().single();
      if (created) {
        threadId = (created as { id: string }).id;
        setActive(prev => prev ? { ...prev, id: threadId } : null);
      }
    }

    const { data: msgs } = await supabase
      .from('inbox_messages').select('*').eq('thread_id', threadId).order('created_at');
    setMessages((msgs ?? []) as Msg[]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // Realtime for active thread
  useEffect(() => {
    if (!active?.id) return;
    const ch = supabase.channel(`inbox-${active.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'inbox_messages',
        filter: `thread_id=eq.${active.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Msg]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  async function send() {
    if (!body.trim() || !active) return;
    let threadId = active.id;
    if (!threadId) {
      const { data: created } = await supabase
        .from('inbox_threads').insert({ child_id: active.child_id }).select().single();
      if (!created) return;
      threadId = (created as { id: string }).id;
      setActive(prev => prev ? { ...prev, id: threadId } : null);
    }
    setSending(true);
    const msg = body.trim();
    setBody('');
    await supabase.from('inbox_messages').insert({
      thread_id: threadId, sender_type: 'leder', sender_name: staffName, body: msg,
    });
    await supabase.from('inbox_threads').update({ last_msg_at: new Date().toISOString() }).eq('id', threadId);
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  if (active) {
    return (
      <div className="flex flex-col h-screen max-w-lg mx-auto">
        {/* Thread header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3 bg-white">
          <button onClick={() => { setActive(null); loadThreads(); }} aria-label="Tilbake til innboks">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <p className="font-black text-gray-900">{active.child_name}</p>
            <p className="text-xs text-gray-400">Melding til ledsagere</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: '80px' }}>
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 pt-8">Ingen meldinger ennå. Skriv til ledsagerne.</p>
          )}
          {messages.map(m => {
            const isMe = m.sender_type === 'leder';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-3xl px-4 py-2.5 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {!isMe && <p className="text-[10px] font-bold mb-0.5 text-gray-500">{m.sender_name}</p>}
                  <p className="text-sm">{m.body}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('nb', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-4 pt-2 bg-white border-t border-gray-100"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2 items-end">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Melding til ledsagere…"
              rows={1}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              aria-label="Send melding"
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40 active:scale-95 flex-shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <h2 className="text-xl font-black text-gray-900 mb-4">Innboks</h2>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søk etter barn…"
          className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400"
          aria-label="Søk i innboks"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Ingen barn funnet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(t => (
            <button
              key={t.child_id}
              onClick={() => openThread(t)}
              aria-label={`Åpne samtale med ledsagere for ${t.child_name}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 w-full text-left active:scale-[0.99] transition-transform min-h-[64px]"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{t.child_name}</p>
                {t.last_msg_at ? (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(t.last_msg_at).toLocaleDateString('nb')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 mt-0.5">Ingen meldinger</p>
                )}
              </div>
              {unread.has(t.id) && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" aria-label="Uleste meldinger" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
