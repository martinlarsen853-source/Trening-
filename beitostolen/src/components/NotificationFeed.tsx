'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Pencil, Plus, Trash2 } from 'lucide-react';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  activity_created: <Plus size={13} />,
  activity_updated: <Pencil size={13} />,
  activity_deleted: <Trash2 size={13} />,
};

const TYPE_COLOR: Record<string, string> = {
  activity_created: 'bg-green-100 text-green-700',
  activity_updated: 'bg-blue-100 text-blue-700',
  activity_deleted: 'bg-red-100 text-red-700',
};

export function NotificationFeed() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState('');

  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') ?? '' : '';

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, created_at')
      .eq('group_id', groupId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifs((data ?? []) as Notif[]);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    const seen = localStorage.getItem('notifSeenAt') ?? new Date(0).toISOString();
    setSeenAt(seen);
    load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;
    const ch = supabase.channel('notifs-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `group_id=eq.${groupId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId, load]);

  function markSeen() {
    const now = new Date().toISOString();
    localStorage.setItem('notifSeenAt', now);
    setSeenAt(now);
  }

  const newCount = notifs.filter(n => n.created_at > seenAt).length;

  if (loading) return null;
  if (notifs.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-gray-400" aria-hidden />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Oppdateringer</p>
          {newCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {newCount} ny
            </span>
          )}
        </div>
        {newCount > 0 && (
          <button onClick={markSeen} className="text-[11px] text-blue-500 font-semibold">
            Merk som lest
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {notifs.map(n => {
          const isNew = n.created_at > seenAt;
          return (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-start gap-3 ${isNew ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_COLOR[n.type] ?? 'bg-gray-100 text-gray-500'}`}>
                {TYPE_ICON[n.type] ?? <Bell size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isNew ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                <p className="text-[11px] text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString('nb', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
