'use client';

import { useEffect, useState } from 'react';
import { type Activity, type StaffMember, type TimeplanActivity, supabase } from '@/lib/supabase';
import { StaffAvatar } from './StaffAvatar';
import { FLAG_CONFIG } from './TransitionBadges';
import { X, Trash2 } from 'lucide-react';

async function pushNotification(groupId: string, type: string, title: string, body?: string, activityId?: string) {
  if (!groupId) return;
  await supabase.from('notifications').insert({ group_id: groupId, type, title, body: body ?? null, activity_id: activityId ?? null });
}

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let mins = 7 * 60; mins <= 21 * 60 + 30; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
})();

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
  packing_items: string[];
  target_child: string | null;
};

type CreateParams = {
  week_start: string;
  day_of_week: number;
  group_id: string;
  is_fritid?: boolean;
};

export function ActivityEditModal({
  activity,
  allStaff,
  groupId,
  createParams,
  onClose,
  onSaved,
  onDeleted,
  onCreated,
}: {
  activity: Pick<Activity | TimeplanActivity, 'id' | 'name' | 'time_start' | 'time_end' | 'location' | 'notes' | 'load_level' | 'transition_flags' | 'transition_note' | 'packing_items'> | null;
  allStaff: StaffMember[];
  groupId?: string;
  createParams?: CreateParams;
  onClose: () => void;
  onSaved?: (updates: ActivityEditUpdates) => void;
  onDeleted?: () => void;
  onCreated?: (activity: ActivityEditUpdates & { id: string }) => void;
}) {
  const isCreate = !activity;
  const [staffList, setStaffList] = useState<StaffMember[]>(allStaff);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actName, setActName] = useState(activity?.name ?? '');
  const [timeStart, setTimeStart] = useState(activity?.time_start.slice(0, 5) ?? '09:00');
  const [timeEnd, setTimeEnd] = useState(activity?.time_end.slice(0, 5) ?? '10:00');
  const [location, setLocation] = useState(activity?.location ?? '');
  const [notes, setNotes] = useState(activity?.notes ?? '');
  const [loadLevel, setLoadLevel] = useState<Activity['load_level']>(activity?.load_level ?? null);
  const [flags, setFlags] = useState<Set<string>>(new Set(activity?.transition_flags ?? []));
  const [transNote, setTransNote] = useState<string>(activity?.transition_note ?? '');
  const [packingInput, setPackingInput] = useState('');
  const [packingItems, setPackingItems] = useState<string[]>(activity?.packing_items ?? []);
  const [targetChild, setTargetChild] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setStaffList(allStaff); }, [allStaff]);

  useEffect(() => {
    if (!activity?.id) return;
    fetch(`/api/activities/${activity.id}`)
      .then(r => r.json())
      .then(d => { if (d.staffIds) setSelected(new Set(d.staffIds as string[])); });
  }, [activity?.id]);

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const [deleting, setDeleting] = useState(false);

  function addPackingItem() {
    const item = packingInput.trim();
    if (item && !packingItems.includes(item)) setPackingItems(prev => [...prev, item]);
    setPackingInput('');
  }

  async function save() {
    setSaving(true);
    const transition_flags = [...flags];
    const transition_note = transNote.trim() || null;
    const name = actName.trim() || (activity?.name ?? 'Ny aktivitet');
    const time_start = timeStart + ':00';
    const time_end = timeEnd + ':00';
    const locationVal = location.trim() || null;
    const notesVal = notes.trim() || null;
    const target_child = targetChild.trim() || null;
    const staffIds = [...selected];
    const updates: ActivityEditUpdates = { name, time_start, time_end, location: locationVal, notes: notesVal, load_level: loadLevel, staffIds, transition_flags, transition_note, packing_items: packingItems, target_child };

    if (isCreate && createParams) {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, ...createParams, staffIds }),
      });
      const json = await res.json() as { activity?: { id: string } };
      if (groupId) await pushNotification(groupId, 'activity_created', `${name} er lagt til`, `${time_start.slice(0,5)}–${time_end.slice(0,5)}${locationVal ? ` · ${locationVal}` : ''}`, json.activity?.id);
      setSaving(false);
      onCreated?.({ ...updates, id: json.activity?.id ?? '' });
    } else if (activity) {
      await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, time_start, time_end, location: locationVal, notes: notesVal, load_level: loadLevel, staffIds, transition_flags, transition_note, packing_items: packingItems, target_child }),
      });
      if (groupId) await pushNotification(groupId, 'activity_updated', `${name} er endret`, `${time_start.slice(0,5)}–${time_end.slice(0,5)}${locationVal ? ` · ${locationVal}` : ''}`, activity.id);
      setSaving(false);
      onSaved?.(updates);
    }
    onClose();
  }

  async function deleteActivity() {
    if (!activity) return;
    if (!window.confirm(`Slett aktiviteten «${activity.name}»?`)) return;
    setDeleting(true);
    await supabase.from('activities').delete().eq('id', activity.id);
    if (groupId) await pushNotification(groupId, 'activity_deleted', `${activity.name} er slettet`, undefined, activity.id);
    setDeleting(false);
    onDeleted?.();
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
              <p className="font-black text-gray-900">{isCreate ? 'Ny aktivitet' : 'Rediger aktivitet'}</p>
              {!isCreate && <p className="text-xs text-gray-400">{activity?.name}</p>}
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
                    <select
                      value={timeStart}
                      onChange={e => setTimeStart(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white appearance-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1 ml-1">Slutt</p>
                    <select
                      value={timeEnd}
                      onChange={e => setTimeEnd(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white appearance-none"
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
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

            {/* Target child */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Spesifikt barn (valgfritt)</p>
              <input
                type="text"
                value={targetChild}
                onChange={e => setTargetChild(e.target.value)}
                placeholder="Barnets navn — la stå tomt for hele gruppen"
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            {/* Packing list */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pakkeliste / ta med</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={packingInput}
                  onChange={e => setPackingInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPackingItem(); } }}
                  placeholder="F.eks. håndkle, badetøy…"
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                />
                <button type="button" onClick={addPackingItem}
                  className="px-4 rounded-2xl bg-blue-50 text-blue-600 font-semibold text-sm">
                  Legg til
                </button>
              </div>
              {packingItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {packingItems.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {item}
                      <button type="button" onClick={() => setPackingItems(prev => prev.filter(i => i !== item))} className="text-blue-400 hover:text-blue-600">×</button>
                    </span>
                  ))}
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

          <div className="px-5 pb-8 flex flex-col gap-2">
            <button
              onClick={save}
              disabled={saving || deleting}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40"
            >
              {saving ? 'Lagrer…' : 'Lagre'}
            </button>
            {onDeleted && (
              <button
                onClick={deleteActivity}
                disabled={deleting || saving}
                aria-label="Slett aktivitet"
                className="w-full py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Trash2 size={14} aria-hidden />
                {deleting ? 'Sletter…' : 'Slett aktivitet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
