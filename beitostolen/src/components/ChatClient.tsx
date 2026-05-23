'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  channel: string;
  sender_name: string;
  is_staff: boolean;
  body: string;
  created_at: string;
};

type Tab = 'gruppe' | 'stab';

export function ChatClient() {
  const [tab, setTab] = useState<Tab>('gruppe');
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load user info from localStorage (auth is disabled)
  useEffect(() => {
    const lederMode = localStorage.getItem('lederMode') === 'true';
    setIsStaff(lederMode);
    const name = lederMode
      ? (localStorage.getItem('staffName') || 'Leder')
      : (localStorage.getItem('parentName') || localStorage.getItem('childName') || '');
    setSenderName(name);
  }, []);

  // Load messages for current tab
  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .eq('channel', tab)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        localStorage.setItem(`msgSeenAt_${tab}`, new Date().toISOString());
      });
  }, [tab]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${tab}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel=eq.${tab}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tab]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !senderName.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      channel: tab,
      sender_name: senderName,
      is_staff: isStaff,
      body: body.trim(),
    });
    setBody('');
    setSending(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const h = String(d.getUTCHours() + 2).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        {(['gruppe', 'stab'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white text-gray-500 ring-1 ring-gray-100'
            }`}
          >
            {t === 'gruppe' ? '💬 Gruppechat' : '📋 Kontakt staben'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-2 pb-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            {tab === 'gruppe' ? 'Ingen meldinger ennå. Si hei! 👋' : 'Ingen meldinger ennå. Still gjerne spørsmål!'}
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender_name === senderName ? 'self-end items-end' : 'self-start items-start'}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {msg.is_staff && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Stab</span>
              )}
              <span className="text-[11px] text-gray-400 font-medium">{msg.sender_name} · {formatTime(msg.created_at)}</span>
            </div>
            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-snug ${
              msg.is_staff
                ? 'bg-blue-600 text-white rounded-tl-sm'
                : msg.sender_name === senderName
                ? 'bg-gray-800 text-white rounded-br-sm'
                : 'bg-white text-gray-900 ring-1 ring-gray-100 rounded-tl-sm'
            }`}>
              {msg.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 pt-2 pb-1 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={tab === 'gruppe' ? 'Skriv til gruppen…' : 'Skriv til staben…'}
          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
