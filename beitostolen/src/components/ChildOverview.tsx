'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronRight, MapPin, Clock } from 'lucide-react';
import { format, startOfWeek, addWeeks } from 'date-fns';

type Child = {
  id: string;
  name: string;
  access_password: string | null;
};

type ChildWithStatus = Child & {
  formLevel: 'grønn' | 'gul' | 'rød' | null;
  absenceCount: number;
};

type NextActivity = {
  id: string;
  name: string;
  time_start: string;
  time_end: string;
  location: string | null;
  target_child: string | null;
};

function cestDate() { return new Date(Date.now() + 2 * 3_600_000); }
function toMins(t: string) { const [h, m] = t.slice(0, 5).split(':').map(Number); return h * 60 + m; }

const DOT: Record<string, string> = {
  grønn: 'bg-green-500',
  gul:   'bg-amber-400',
  rød:   'bg-red-500',
};

export function ChildOverview({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [children, setChildren] = useState<ChildWithStatus[]>([]);
  const [nextAct, setNextAct] = useState<NextActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') ?? '' : '';

  const load = useCallback(async () => {
    const now = cestDate();
    const dayOfWeek = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
    const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const today = now.toISOString().slice(0, 10);

    try {
      // If no groupId (staff logged in without a group), fetch all children
      let childQuery = supabase.from('children').select('id, name, access_password').order('name');
      if (groupId) childQuery = childQuery.eq('group_id', groupId);

      // For activity: use first active group if no groupId
      let actGroupId = groupId;
      if (!actGroupId) {
        const { data: grp } = await supabase.from('groups').select('id').eq('status', 'aktiv').order('label').limit(1).single();
        actGroupId = (grp as { id: string } | null)?.id ?? '';
      }

      const [childRes, checkinRes, absenceRes, actRes] = await Promise.all([
        childQuery,
        supabase.from('daily_checkins').select('child_name, form_level').eq('date', today),
        supabase.from('absences').select('child_name')
          .gte('registered_at', today + 'T00:00:00Z')
          .lte('registered_at', today + 'T23:59:59Z'),
        supabase.from('activities').select('id, name, time_start, time_end, location, target_child')
          .eq('group_id', actGroupId).eq('week_start', weekStart).eq('day_of_week', dayOfWeek)
          .eq('is_fritid', false).order('time_start'),
      ]);

      const checkinMap: Record<string, 'grønn' | 'gul' | 'rød'> = {};
      for (const r of (checkinRes.data ?? []) as { child_name: string; form_level: 'grønn' | 'gul' | 'rød' }[]) {
        checkinMap[r.child_name] = r.form_level;
      }
      const absenceMap: Record<string, number> = {};
      for (const r of (absenceRes.data ?? []) as { child_name: string }[]) {
        absenceMap[r.child_name] = (absenceMap[r.child_name] ?? 0) + 1;
      }

      setChildren(((childRes.data ?? []) as Child[]).map(ch => ({
        ...ch,
        formLevel: checkinMap[ch.name] ?? null,
        absenceCount: absenceMap[ch.name] ?? 0,
      })));

      const acts = (actRes.data ?? []) as NextActivity[];
      const next = acts.find(a => toMins(a.time_end) > nowMins) ?? null;
      setNextAct(next);
    } catch {
      // silently ignore
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="px-4 pt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">

      {/* Role badge */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900">Oversikt</h2>
          <p className="text-sm text-gray-500">{children.length} barn i gruppen</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isAdmin ? 'Leder' : 'Student'}
        </span>
      </div>

      {/* Next activity */}
      {nextAct && (
        <div className="bg-blue-600 rounded-3xl px-5 py-4 mb-5 shadow-lg shadow-blue-200">
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Neste aktivitet</p>
          <p className="text-lg font-black text-white leading-tight">{nextAct.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-blue-100 text-sm">
              <Clock size={13} aria-hidden />
              <span>{nextAct.time_start.slice(0, 5)}–{nextAct.time_end.slice(0, 5)}</span>
            </div>
            {nextAct.location && (
              <div className="flex items-center gap-1.5 text-blue-100 text-sm">
                <MapPin size={13} aria-hidden />
                <span>{nextAct.location}</span>
              </div>
            )}
          </div>
          {nextAct.target_child && (
            <p className="text-blue-200 text-xs mt-1.5">Kun: {nextAct.target_child}</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {(['grønn','gul','rød'] as const).map(k => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${DOT[k]}`} />
            <span className="text-xs text-gray-400 capitalize">{k === 'grønn' ? 'God form' : k === 'gul' ? 'Middels' : 'Lav form'}</span>
          </div>
        ))}
      </div>

      {/* Children */}
      <div className="flex flex-col gap-2">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => router.push(`/barn/${child.id}`)}
            aria-label={`Åpne profil for ${child.name}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3 w-full text-left active:scale-[0.99] transition-transform min-h-[64px]"
          >
            <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${DOT[child.formLevel ?? ''] ?? 'bg-gray-200'}`} aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{child.name}</p>
              {child.absenceCount > 0 && (
                <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  {child.absenceCount} avbud
                </span>
              )}
            </div>
            <ChevronRight size={18} className="text-gray-300 flex-shrink-0" aria-hidden />
          </button>
        ))}
      </div>

      {children.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👶</p>
          <p className="text-sm">Ingen barn registrert i gruppen</p>
        </div>
      )}
    </div>
  );
}
