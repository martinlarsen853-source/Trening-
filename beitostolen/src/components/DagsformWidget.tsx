'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type FormLevel = 'grønn' | 'gul' | 'rød';

const LEVELS: { value: FormLevel; label: string; active: string; inactive: string }[] = [
  { value: 'grønn', label: '🟢 Klar',   active: 'bg-green-500 text-white shadow-sm shadow-green-200', inactive: 'bg-gray-100 text-gray-500' },
  { value: 'gul',   label: '🟡 Sliten', active: 'bg-amber-400 text-white shadow-sm shadow-amber-200', inactive: 'bg-gray-100 text-gray-500' },
  { value: 'rød',   label: '🔴 Urolig', active: 'bg-red-500 text-white shadow-sm shadow-red-200',    inactive: 'bg-gray-100 text-gray-500' },
];

const DOT: Record<FormLevel, string> = {
  grønn: 'bg-green-500',
  gul:   'bg-amber-400',
  rød:   'bg-red-500',
};

function todayDate() {
  return new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10);
}

function AllCheckins({ refreshKey }: { refreshKey: number }) {
  const [checkins, setCheckins] = useState<Array<{ child_name: string; form_level: FormLevel }>>([]);

  useEffect(() => {
    supabase
      .from('daily_checkins')
      .select('child_name, form_level')
      .eq('date', todayDate())
      .then(({ data }) => { if (data) setCheckins(data as typeof checkins); });
  }, [refreshKey]);

  if (checkins.length === 0) return (
    <p className="px-4 pb-2 text-xs text-gray-400 italic">Ingen dagsform registrert i dag ennå.</p>
  );

  return (
    <div className="px-4 pb-3">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Dagsform i dag</p>
      <div className="flex flex-wrap gap-2">
        {checkins.map((c) => (
          <div key={c.child_name} className="flex items-center gap-1.5 bg-white border border-gray-100 px-2.5 py-1.5 rounded-full shadow-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[c.form_level]}`} />
            <span className="text-xs font-medium text-gray-700">{c.child_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DagsformWidget({ childName, isLeder }: { childName: string; isLeder?: boolean }) {
  // null = not yet loaded from DB; treat as default 'grønn' visually
  const [form, setForm] = useState<FormLevel | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setForm(null);
    setLoaded(false);
    supabase
      .from('daily_checkins')
      .select('form_level')
      .eq('child_name', childName)
      .eq('date', todayDate())
      .maybeSingle()
      .then(({ data }) => {
        setForm(data ? (data.form_level as FormLevel) : null);
        setLoaded(true);
      });
  }, [childName]);

  // Displayed level: null (not set) shows as grønn selected
  const displayLevel: FormLevel = form ?? 'grønn';

  async function handleSelect(level: FormLevel) {
    setSaving(true);
    setForm(level);
    await supabase.from('daily_checkins').upsert(
      { child_name: childName, date: todayDate(), form_level: level },
      { onConflict: 'child_name,date' }
    );
    setSaving(false);
    setRefreshKey((k) => k + 1);
  }

  if (!loaded) return null;

  return (
    <div className="py-2 border-b border-gray-50">
      {isLeder && <AllCheckins refreshKey={refreshKey} />}
      <div className="flex items-center gap-2 px-4 pt-1">
        <span className="text-sm text-gray-500 flex-shrink-0">
          {isLeder ? `${childName}:` : 'Dagsform:'}
        </span>
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => handleSelect(l.value)}
              disabled={saving}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                displayLevel === l.value ? l.active : l.inactive
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
