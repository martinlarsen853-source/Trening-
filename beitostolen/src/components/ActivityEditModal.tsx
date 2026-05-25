'use client';

import { useEffect, useState } from 'react';
import { type Activity, type StaffMember, type TimeplanActivity } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { FLAG_CONFIG } from './TransitionBadges';
import { X } from 'lucide-react';

const LOAD_OPTIONS = [
  { value: 'lav',     label: 'Lav',     bg: 'bg-green-500', ring: 'ring-green-400' },
  { value: 'middels', label: 'Middels', bg: 'bg-amber-400', ring: 'ring-amber-400' },
  { value: 'høy',     label: 'Høy',     bg: 'bg-red-500',   ring: 'ring-red-400'   },
] as const;

export type ActivityEditUpdates = {
  name: string;
  time_start: string;
  time_end: string;
  location: string | null;
  notes: string | null;
  load_level: Activity['load_level'];
  staffIds: string[];
  transition_flags: string[];
  transition_note: string | null;
};

export function ActivityEditModal({
  activity,
  allStaff,
  onClose,
  onSaved,
}: {
  activity: Pick<Activity | TimeplanActivity, 'id' | 'name' | 'time_start' | 'time_end' | 'location' | 'notes' | 'load_level' | 'transition_flags' | 'transition_note'>;
  allStaff: StaffMember[];
  onClose: () => void;
  onSaved: (updates: ActivityEditUpdates) => void;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>(allStaff);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actName, setActName] = useState(activity.name);
  const [timeStart, setTimeStart] = useState(activity.time_start.slice(0, 5));
  const [timeEnd, setTimeEnd] = useState(activity.time_end.slice(0, 5));
  const [location, setLocation] = useState(activity.location ?? '');
  const [notes, setNotes] = useState(activity.notes ?? '');
  const [loadLevel, setLoadLevel] = useState<Activity['load_level']>(activity.load_level);
  const [flags, setFlags] = useState<Set<string>>(new Set(activity.transition_flags ?? []));
  const [transNote, setTransNote] = useState<string>(activity.transition_note ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setStaffList(allStaff); }, [allStaff]);

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
    const transition_flags = [...flags];
    const transition_note = transNote.trim() || null;
    const name = actName.trim() || activity.name;
    const time_start = timeStart + ':00';
    const time_end = timeEnd + ':00';
    const locationVal = location.trim() || null;
    const notesVal = notes.trim() || null;

    await fetch(`/api/activities/${activity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, time_start, time_end, location: locationVal, notes: notesVal, load_level: loadLevel, staffIds: [...selected], transition_flags, transition_note }),
    });
    setSaving(false);
    onSaved({ name, time_start, time_end, location: locationVal, notes: notesVal, load_level: loadLevel, staffIds: [...selected], transition_flags, transition_note });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
        <div
          className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
          style={{ maxHeight: '92vh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <p className="font-black text-gray-900">Rediger aktivitet</p>
              <p className="text-xs text-gray-400">{activity.name}</p>
            </div>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>

          <div className="px-5 pt-4 pb-6 space-y-6">

            {/* Basic info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basisinfo</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={actName}
                  onChange={e => setActName(e.target.value)}
                  placeholder="Aktivitetsnavn"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1 ml-1">Start</p>
                    <input
                      type="time"
                      value={timeStart}
                      onChange={e => setTimeStart(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1 ml-1">Slutt</p>
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={e => setTimeEnd(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Sted (valgfritt)"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notater (valgfritt)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>

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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Hvem leder timen?</p>
              {staffList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Ingen ansatte ennå — gå til Ansatte for å legge til
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

            {/* Transition flags */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Overgangsinfo</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(FLAG_CONFIG).map(([key, cfg]) => {
                  const on = flags.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFlags(prev => { const n = new Set(prev); on ? n.delete(key) : n.add(key); return n; })}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${
                        on ? `${cfg.bg} ${cfg.text} border-current` : 'bg-gray-50 text-gray-400 border-transparent'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={transNote}
                onChange={e => setTransNote(e.target.value)}
                placeholder="Tilleggsinfo (valgfritt)…"
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="px-5 pb-8">
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
