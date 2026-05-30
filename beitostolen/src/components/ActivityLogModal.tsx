'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Activity } from '@/lib/supabase';
import { X } from 'lucide-react';

type HowWent = 'bra' | 'ok' | 'vanskelig';
type LoadAfter = 'lav' | 'middels' | 'høy';

const HOW_OPTIONS: { v: HowWent; label: string; bg: string; text: string }[] = [
  { v: 'bra',       label: '😊 Bra',        bg: 'bg-green-500',  text: 'text-white' },
  { v: 'ok',        label: '😐 Ok',          bg: 'bg-amber-400',  text: 'text-white' },
  { v: 'vanskelig', label: '😔 Vanskelig',   bg: 'bg-red-500',    text: 'text-white' },
];

const LOAD_OPTIONS: { v: LoadAfter; label: string; bg: string; text: string }[] = [
  { v: 'lav',     label: '🟢 Lav',     bg: 'bg-green-500',  text: 'text-white' },
  { v: 'middels', label: '🟡 Middels', bg: 'bg-amber-400',  text: 'text-white' },
  { v: 'høy',     label: '🔴 Høy',     bg: 'bg-red-500',    text: 'text-white' },
];

export function ActivityLogModal({
  activity,
  date,
  loggedBy,
  onClose,
}: {
  activity: Pick<Activity, 'id' | 'name'>;
  date: string;
  loggedBy: string;
  onClose: () => void;
}) {
  const [howWent, setHowWent] = useState<HowWent | null>(null);
  const [loadAfter, setLoadAfter] = useState<LoadAfter | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!howWent) return;
    setSaving(true);
    await supabase.from('activity_logs').insert({
      activity_id: activity.id,
      date,
      how_went: howWent,
      load_after: loadAfter,
      notes: notes.trim() || null,
      logged_by: loggedBy,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1060] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Logg aktivitet</p>
              <p className="font-bold text-gray-900 text-lg leading-tight">{activity.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <X size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Hvordan gikk det?</p>
          <div className="grid grid-cols-3 gap-2">
            {HOW_OPTIONS.map(o => (
              <button
                key={o.v}
                onClick={() => setHowWent(o.v)}
                className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                  howWent === o.v ? `${o.bg} ${o.text} border-transparent` : 'bg-gray-50 text-gray-500 border-transparent'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Belastning etterpå</p>
          <div className="grid grid-cols-3 gap-2">
            {LOAD_OPTIONS.map(o => (
              <button
                key={o.v}
                onClick={() => setLoadAfter(prev => prev === o.v ? null : o.v)}
                className={`py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                  loadAfter === o.v ? `${o.bg} ${o.text} border-transparent` : 'bg-gray-50 text-gray-500 border-transparent'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notat (valgfritt)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="F.eks. trenger pause mellom basseng og gymsal"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
          />
        </div>

        <div className="px-5 pb-8 pt-1">
          <button
            onClick={save}
            disabled={!howWent || saving}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {saving ? 'Lagrer…' : 'Lagre logg'}
          </button>
        </div>
      </div>
    </div>
  );
}
