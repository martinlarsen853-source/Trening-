'use client';

import { useEffect, useState } from 'react';
import { supabase, type Activity, type Attendance } from '@/lib/supabase';
import { X, Plus } from 'lucide-react';

type ChildRow = { name: string; present: boolean | null };

export function AttendanceModal({
  activity,
  date,
  markedBy,
  onClose,
}: {
  activity: Activity;
  date: string;
  markedBy: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<ChildRow[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profilesRes, attendanceRes] = await Promise.all([
        supabase.from('child_profiles').select('child_name').order('child_name'),
        supabase.from('attendance').select('*').eq('activity_id', activity.id).eq('date', date),
      ]);

      const names: string[] = (profilesRes.data ?? []).map((r: { child_name: string }) => r.child_name);
      const attMap: Record<string, boolean> = {};
      for (const a of (attendanceRes.data ?? []) as Attendance[]) {
        attMap[a.child_name] = a.present;
        if (!names.includes(a.child_name)) names.push(a.child_name);
      }
      names.sort();
      setRows(names.map(n => ({ name: n, present: attMap[n] ?? null })));
      setLoading(false);
    }
    load();
  }, [activity.id, date]);

  async function toggle(name: string) {
    const current = rows.find(r => r.name === name);
    const next = current?.present === true ? false : true;
    setRows(prev => prev.map(r => r.name === name ? { ...r, present: next } : r));
    await supabase.from('attendance').upsert(
      { activity_id: activity.id, date, child_name: name, present: next, marked_by: markedBy, marked_at: new Date().toISOString() },
      { onConflict: 'activity_id,date,child_name' }
    );
  }

  async function addChild() {
    const name = newName.trim();
    if (!name || rows.some(r => r.name.toLowerCase() === name.toLowerCase())) return;
    setNewName('');
    setRows(prev => [...prev, { name, present: true }].sort((a, b) => a.name.localeCompare(b.name)));
    await supabase.from('attendance').upsert(
      { activity_id: activity.id, date, child_name: name, present: true, marked_by: markedBy, marked_at: new Date().toISOString() },
      { onConflict: 'activity_id,date,child_name' }
    );
  }

  const present = rows.filter(r => r.present === true).length;
  const absent  = rows.filter(r => r.present === false).length;
  const total   = rows.length;

  return (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-black text-gray-900">Fremmøte</p>
            <p className="text-xs text-gray-400">{activity.name} · {activity.time_start.slice(0, 5)}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Summary */}
        <div className="flex gap-3 px-5 py-3">
          <div className="flex-1 bg-green-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-green-700">{present}</p>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Møtt</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-red-600">{absent}</p>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Borte</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-gray-600">{total - present - absent}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ukjent</p>
          </div>
        </div>

        {/* Child list */}
        <div className="px-5 pb-2 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Laster…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Ingen barn registrert — legg til nedenfor
            </div>
          ) : (
            rows.map(row => (
              <button
                key={row.name}
                onClick={() => toggle(row.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  row.present === true
                    ? 'border-green-400 bg-green-50'
                    : row.present === false
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  row.present === true ? 'bg-green-500 text-white' :
                  row.present === false ? 'bg-red-400 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {row.present === true ? '✓' : row.present === false ? '✕' : '?'}
                </span>
                <span className={`font-semibold text-sm ${
                  row.present === true ? 'text-green-800' :
                  row.present === false ? 'text-red-700' :
                  'text-gray-600'
                }`}>{row.name}</span>
                <span className="ml-auto text-[10px] text-gray-400">
                  {row.present === true ? 'Møtt' : row.present === false ? 'Borte' : 'Trykk for å registrere'}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Add child */}
        <div className="px-5 pt-2 pb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Legg til barn</p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addChild()}
              placeholder="Fornavn"
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={addChild}
              disabled={!newName.trim()}
              className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-30"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttendanceBadge({ activityId, date }: { activityId: string; date: string }) {
  const [counts, setCounts] = useState<{ present: number; total: number } | null>(null);

  useEffect(() => {
    supabase
      .from('attendance')
      .select('present')
      .eq('activity_id', activityId)
      .eq('date', date)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const present = (data as { present: boolean }[]).filter(r => r.present).length;
        setCounts({ present, total: data.length });
      });
  }, [activityId, date]);

  if (!counts) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
      ✓ {counts.present}/{counts.total}
    </span>
  );
}
