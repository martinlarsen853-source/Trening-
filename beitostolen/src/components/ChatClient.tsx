'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Loader2 } from 'lucide-react';

type GroupMsg = { id: string; channel: string; sender_name: string; is_staff: boolean; body: string; created_at: string };
type InboxMsg = { id: string; thread_id: string; sender_type: 'leder' | 'companion'; sender_name: string; body: string; created_at: string };
type Tab = 'gruppe' | 'med_leder';

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = String((d.getUTCHours() + 2) % 24).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function ChatClient() {
  const [tab, setTab] = useState<Tab>('gruppe');
  const [groupMsgs, setGroupMsgs] = useState<GroupMsg[]>([]);
  const [inboxMsgs, setInboxMsgs] = useState<InboxMsg[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState('');
  const [companionId, setCompanionId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('companionName') || localStorage.getItem('childName') || '';
    setSenderName(name);
    setCompanionId(localStorage.getItem('companionId'));
    setChildId(localStorage.getItem('childId'));
  }, []);

  // Load group messages
  useEffect(() => {
    if (tab !== 'gruppe') return;
    supabase.from('messages').select('*').eq('channel', 'gruppe').order('created_at', { ascending: true })
      .then(({ data }) => { setGroupMsgs((data ?? []) as GroupMsg[]); localStorage.setItem('msgSeenAt_gruppe', new Date().toISOString()); });
  }, [tab]);

  // Load inbox thread
  const loadThread = useCallback(async () => {
    if (!childId) return;
    const { data: t } = await supabase.from('inbox_threads').select('id').eq('child_id', childId).maybeSingle();
    const tid = (t as { id: string } | null)?.id ?? null;
    setThreadId(tid);
    if (tid) {
      const { data: msgs } = await supabase.from('inbox_messages').select('*').eq('thread_id', tid).order('created_at');
      setInboxMsgs((msgs ?? []) as InboxMsg[]);
      localStorage.setItem(`threadSeenAt_${childId}`, new Date().toISOString());
    }
  }, [childId]);

  useEffect(() => { if (tab === 'med_leder') loadThread(); }, [tab, loadThread]);

  // Realtime group
  useEffect(() => {
    if (tab !== 'gruppe') return;
    const ch = supabase.channel('chat-gruppe')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'channel=eq.gruppe' },
        (p) => setGroupMsgs(prev => [...prev, p.new as GroupMsg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tab]);

  // Realtime inbox messages (when thread exists)
  useEffect(() => {
    if (!threadId || tab !== 'med_leder') return;
    const ch = supabase.channel(`inbox-ledsager-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages', filter: `thread_id=eq.${threadId}` },
        (p) => { setInboxMsgs(prev => [...prev, p.new as InboxMsg]); localStorage.setItem(`threadSeenAt_${childId}`, new Date().toISOString()); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, tab, childId]);

  // Watch for a new thread being created (leder sends first message)
  useEffect(() => {
    if (threadId || tab !== 'med_leder' || !childId) return;
    const ch = supabase.channel(`inbox-thread-watch-${childId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_threads' },
        () => loadThread())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, tab, childId, loadThread]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [groupMsgs, inboxMsgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const msg = body.trim();
    setBody('');
    if (tab === 'gruppe') {
      await supabase.from('messages').insert({ channel: 'gruppe', sender_name: senderName, is_staff: false, body: msg });
    } else {
      let tid = threadId;
      if (!tid && childId) {
        const { data: created } = await supabase.from('inbox_threads').insert({ child_id: childId }).select().single();
        if (created) { tid = (created as { id: string }).id; setThreadId(tid); }
      }
      if (tid) {
        await supabase.from('inbox_messages').insert({
          thread_id: tid, sender_type: 'companion', sender_name: senderName,
          sender_id: companionId, body: msg,
        });
        await supabase.from('inbox_threads').update({ last_msg_at: new Date().toISOString() }).eq('id', tid);
      }
    }
    setSending(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }

  const msgs = tab === 'gruppe' ? groupMsgs : inboxMsgs;

  return (
    <div
      className="flex flex-col bg-white max-w-lg mx-auto"
      style={{ height: 'calc(100svh - 110px)', paddingBottom: 'calc(57px + env(safe-area-inset-bottom, 0px))' }}
    >

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1 flex-shrink-0">
        {(['gruppe', 'med_leder'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${tab === t ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-white text-gray-500 ring-1 ring-gray-100'}`}
          >
            {t === 'gruppe' ? '💬 Gruppechat' : '🏥 Med leder'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-2 py-2">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center text-center mt-12 px-6 gap-2">
            <span className="text-4xl">{tab === 'gruppe' ? '💬' : '✉️'}</span>
            <p className="font-semibold text-gray-700 mt-1">Ingen meldinger ennå</p>
            <p className="text-sm text-gray-400">
              {tab === 'gruppe'
                ? 'Vær den første — si hei til gruppen! 👋'
                : 'Skriv en melding til lederen nedenfor, så svarer de så snart de kan.'}
            </p>
          </div>
        )}
        {tab === 'gruppe' && (groupMsgs as GroupMsg[]).map(msg => {
          const isMe = msg.sender_name === senderName;
          return (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {msg.is_staff && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Stab</span>}
                <span className="text-[11px] text-gray-400 font-medium">{msg.sender_name} · {formatTime(msg.created_at)}</span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-snug ${msg.is_staff ? 'bg-blue-600 text-white' : isMe ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 ring-1 ring-gray-100'}`}>
                {msg.body}
              </div>
            </div>
          );
        })}
        {tab === 'med_leder' && (inboxMsgs as InboxMsg[]).map(msg => {
          const isMe = msg.sender_type === 'companion';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-3xl px-4 py-2.5 ${isMe ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}`}>
                {!isMe && <p className="text-[10px] font-bold mb-0.5 text-blue-200">Leder</p>}
                <p className="text-sm">{msg.body}</p>
                <p className="text-[10px] mt-1 text-right text-blue-200">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex-shrink-0 px-4 pt-2 pb-2 border-t border-gray-100">
        {senderName && (
          <p className="text-[11px] text-gray-400 mb-1.5 pl-1">
            Sender som <span className="font-semibold text-gray-600">{senderName}</span>
          </p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as React.FormEvent); } }}
            placeholder={tab === 'gruppe' ? 'Skriv til gruppen…' : 'Skriv til lederen…'}
            rows={1}
            aria-label={tab === 'gruppe' ? 'Melding til gruppen' : 'Melding til leder'}
            className="flex-1 min-w-0 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none overflow-hidden leading-snug"
            style={{ maxHeight: 150 }}
          />
          <button type="submit" disabled={sending || !body.trim()} aria-label="Send melding"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40 active:scale-95 flex-shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
}
