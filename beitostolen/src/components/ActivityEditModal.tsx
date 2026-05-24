'use client';

import { useEffect, useState } from 'react';
import { type Activity, type StaffMember, type TimeplanActivity } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { X } from 'lucide-react';

const LOAD_OPTIONS = [
  { value: 'lav',     label: 'Lav',     bg: 'bg-green-500', ring: 'ring-green-400' },
  { value: 'middels', label: 'Middels', bg: 'bg-amber-400', ring: 'ring-amber-400' },
  { value: 'høy',     label: 'Høy',     bg: 'bg-red-500',   ring: 'ring-red-400'   },
] as const;

export function ActivityEditModal({
  activity,
  allStaff,
  onClose,
  onSaved,
}: {
  activity: Pick<Activity | TimeplanActivity, 'id' | 'name' | 'time_start' | 'time_end' | 'load_level'>;
  allStaff: StaffMember[];
  onClose: () => void;
  onSaved: (updates: { load_level: Activity['load_level']; staffIds: string[] }) => void;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>(allStaff);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadLevel, setLoadLevel] = useState<Activity['load_level']>(activity.load_level);
  const [saving, setSaving] = useState(false);

  // Keep staffList in sync if allStaff prop changes (e.g. parent fetches later)
  useEffect(() => { setStaffList(allStaff); }, [allStaff]);

  // Load current staff assignments (server-side to avoid client CORS issues)
  useEffect(() => {
    fetch(`/api/activities/${activity.id}`)
      .then(r => r.json())
      .then(d => { if (d.staffIds) setSelected(new Set(d.staffIds as string[])); });
  }, [activity.id]);

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/activities/${activity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_level: loadLevel, staffIds: [...selected] }),
    });
    setSaving(false);
    onSaved({ load_level: loadLevel, staffIds: [...selected] });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
        <div
          className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
          style={{ maxHeight: '85vh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <p className="font-black text-gray-900">{activity.name}</p>
              <p className="text-xs text-gray-400">{activity.time_start.slice(0, 5)} – {activity.time_end.slice(0, 5)}</p>
            </div>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>

          <div className="px-5 pt-4 pb-6 space-y-6">
            {/* Load level */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Belastningsnivå</p>
              <div className="flex gap-2">
                {LOAD_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setLoadLevel(prev => prev === o.value ? null : o.value)}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ring-2 ${
                      loadLevel === o.value
                        ? `${o.bg} text-white ${o.ring}`
                        : 'bg-gray-100 text-gray-500 ring-transparent'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff selection */}
            <div>
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hvem leder timen?</p>
              </div>

              {staffList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Ingen ansatte ennå — trykk «Ny ansatt» for å legge til
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {staffList.map(s => {
                    const on = selected.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggle(s.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border-2 ${
                          on ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                        }`}
                      >
                        <div className="relative">
                          <StaffAvatar name={s.name} photoUrl={s.photo_url} size="lg" />
                          {on && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
                          {s.name.split(' ')[0]}
                        </p>
                        {s.title && (
                          <p className="text-[10px] text-gray-400 text-center leading-tight">{s.title}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-6">
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40"
            >
              {saving ? 'Lagrer…' : 'Lagre'}
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
