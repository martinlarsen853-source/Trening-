'use client';

import { useEffect, useState } from 'react';
import { supabase, type ChildProfile } from '@/lib/supabase';

export const ALL_ADAPTATIONS: { key: string; label: string; color: string }[] = [
  { key: 'hørselvern',       label: '🎧 Hørselvern',          color: 'bg-purple-100 text-purple-700' },
  { key: 'kjent_ledsager',   label: '👥 Kjent ledsager',       color: 'bg-blue-100 text-blue-700'    },
  { key: 'rolig_overgang',   label: '🚶 Rolig overgang',        color: 'bg-teal-100 text-teal-700'    },
  { key: 'pause_etter',      label: '⏸ Pause etter',           color: 'bg-amber-100 text-amber-700'  },
  { key: 'pause_før',        label: '⏸ Pause før',             color: 'bg-amber-100 text-amber-700'  },
  { key: 'kan_observere',    label: '👁 Kan observere',         color: 'bg-gray-100 text-gray-700'    },
  { key: 'kan_forlate',      label: '🚪 Kan forlate tidlig',    color: 'bg-orange-100 text-orange-700'},
  { key: 'dempet_lyd',       label: '🔇 Dempet lyd',            color: 'bg-indigo-100 text-indigo-700'},
  { key: 'ekstra_tid',       label: '⏱ Ekstra tid',            color: 'bg-sky-100 text-sky-700'      },
  { key: 'drikke',           label: '💧 Drikke tilgjengelig',   color: 'bg-cyan-100 text-cyan-700'    },
  { key: 'temperatur',       label: '🌡 Temperatursensitiv',    color: 'bg-red-100 text-red-700'      },
  { key: 'lav_terskel',      label: '🛑 Lav terskel for avbud', color: 'bg-rose-100 text-rose-700'   },
];

const COLOR_MAP = Object.fromEntries(ALL_ADAPTATIONS.map(a => [a.key, a.color]));
const LABEL_MAP = Object.fromEntries(ALL_ADAPTATIONS.map(a => [a.key, a.label]));

function EditModal({ childName, profile, onClose, onSaved }: {
  childName: string;
  profile: ChildProfile | null;
  onClose: () => void;
  onSaved: (p: ChildProfile) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(profile?.adaptations ?? []));
  const [note, setNote] = useState(profile?.note ?? '');
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    const { data } = await supabase
      .from('children')
      .update({ adaptations: [...selected], note: note.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (data) onSaved(data as ChildProfile);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl max-w-lg mx-auto overflow-y-auto" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-black text-gray-900">Tilpasninger</p>
          <p className="text-xs text-gray-400">{childName}</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {ALL_ADAPTATIONS.map(a => {
            const on = selected.has(a.key);
            return (
              <button key={a.key} onClick={() => toggle(a.key)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all text-left ${
                  on ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'
                }`}>
                <span className={`text-sm font-semibold ${on ? 'text-blue-700' : 'text-gray-600'}`}>{a.label}</span>
                {on && <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notat (valgfritt)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="F.eks. trenger 10 min hvile mellom basseng og gymsal"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
          />
        </div>
        <div className="px-5 pb-6 pt-2">
          <button onClick={save} disabled={saving}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40">
            {saving ? 'Lagrer…' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChildAdaptations({ childName, isLeder }: { childName: string; isLeder: boolean }) {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    supabase.from('children').select('*').eq('name', childName).maybeSingle()
      .then(({ data }) => setProfile(data as ChildProfile | null));
  }, [childName]);

  const tags = profile?.adaptations ?? [];

  if (!isLeder && tags.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tilpasninger</p>
        {isLeder && (
          <button onClick={() => setEditing(true)} className="text-[10px] font-semibold text-blue-500">
            {tags.length === 0 ? '+ Legg til' : 'Rediger'}
          </button>
        )}
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(key => (
            <span key={key} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${COLOR_MAP[key] ?? 'bg-gray-100 text-gray-600'}`}>
              {LABEL_MAP[key] ?? key}
            </span>
          ))}
          {profile?.note && (
            <span className="text-[11px] text-gray-500 italic mt-0.5 w-full">{profile.note}</span>
          )}
        </div>
      ) : isLeder ? (
        <p className="text-xs text-gray-300">Ingen tilpasninger registrert</p>
      ) : null}

      {editing && (
        <EditModal
          childName={childName}
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={p => setProfile(p)}
        />
      )}
    </div>
  );
}
