'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Calendar, Utensils, MessageCircle, Settings } from 'lucide-react';

function useRole() {
  const [role, setRole] = useState<'leder' | 'student' | 'ledsager'>('ledsager');
  useEffect(() => {
    if (localStorage.getItem('lederMode') === 'true') setRole('leder');
    else if (localStorage.getItem('staffRole') === 'student') setRole('student');
    else setRole('ledsager');
  }, []);
  return role;
}

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const isStaff = role === 'leder' || role === 'student';
  const chatHref = isStaff ? '/inbox' : '/chat';
  const chatActive = isStaff ? pathname === '/inbox' : pathname === '/chat';
  const [chatUnread, setChatUnread] = useState(false);

  useEffect(() => {
    if (chatActive) {
      setChatUnread(false);
      return;
    }
    checkUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, role]);

  async function checkUnread() {
    try {
      if (isStaff) {
        const since = localStorage.getItem('inboxSeenAt') ?? new Date(0).toISOString();
        const { count } = await supabase
          .from('inbox_messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_type', 'companion')
          .gt('created_at', since);
        setChatUnread((count ?? 0) > 0);
      } else {
        const senderName = localStorage.getItem('companionName') || localStorage.getItem('childName') || '';
        const seenGroupe = localStorage.getItem('msgSeenAt_gruppe') ?? new Date(0).toISOString();
        const childId = localStorage.getItem('childId') ?? '';
        const threadSeen = localStorage.getItem(`threadSeenAt_${childId}`) ?? new Date(0).toISOString();

        const [g, t] = await Promise.all([
          supabase.from('messages').select('id', { count: 'exact', head: true })
            .eq('channel', 'gruppe').gt('created_at', seenGroupe).neq('sender_name', senderName),
          supabase.from('inbox_threads').select('id').eq('child_id', childId).maybeSingle(),
        ]);
        let threadUnread = 0;
        if (t.data) {
          const { count } = await supabase
            .from('inbox_messages')
            .select('id', { count: 'exact', head: true })
            .eq('thread_id', (t.data as { id: string }).id)
            .eq('sender_type', 'leder')
            .gt('created_at', threadSeen);
          threadUnread = count ?? 0;
        }
        setChatUnread((g.count ?? 0) + threadUnread > 0);
      }
    } catch { /* ignore */ }
  }

  const tabs = [
    { href: '/',            label: 'Hjem',      Icon: Home        },
    { href: '/timeplan',    label: 'Timeplan',  Icon: Calendar    },
    { href: '/mat',         label: 'Mat',        Icon: Utensils    },
    { href: chatHref,       label: 'Chat',       Icon: MessageCircle },
    { href: '/innstillinger', label: 'Innst.',   Icon: Settings    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[999] bg-white/96 backdrop-blur-md border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -1px 20px rgba(0,0,0,0.06)', touchAction: 'manipulation' }}
      aria-label="Hovednavigasjon"
    >
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === chatHref ? chatActive : pathname === href;
          const isChatTab = href === chatHref;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-1 select-none min-h-[56px] justify-center transition-opacity active:opacity-50 ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`relative px-3 py-1.5 rounded-xl transition-colors duration-150 ${active ? 'bg-blue-50' : ''}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden />
                {isChatTab && chatUnread && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" aria-label="Uleste meldinger" />
                )}
              </div>
              <span className="text-[10px] font-bold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
