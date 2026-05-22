'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type FormLevel = 'grønn' | 'gul' | 'rød';

const LEVELS: { value: FormLevel; label: string; active: string; inactive: string }[] = [
  { value: 'grønn', label: '🟢 Klar',   active: 'bg-green-500 text-white shadow-sm shadow-green-200', inactive: 'bg-gray-100 text-gray-500' },
  { value: 'gul',   label: '🟡 Sliten', active: 'bg-amber-400 text-white shadow-sm shadow-amber-200', inactive: 'bg-gray-100 text-gray-500' },
  { value: 'rød',   label: '🔴 Urolig', active: 'bg-red-500 text-white shadow-sm shadow-red-200',    inactive: 'bg-gray-100 text-gray-500' },
];

function todayDate() {
  return new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 10);
}

export function DagsformWidget({ childName }: { childName: string }) {
  const [form, setForm] = useState<FormLevel | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('daily_checkins')
      .select('form_level')
      .eq('child_name', childName)
      .eq('date', todayDate())
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data.form_level as FormLevel);
      });
  }, [childName]);

  async function handleSelect(level: FormLevel) {
    setSaving(true);
    setForm(level);
    await supabase.from('daily_checkins').upsert(
      { child_name: childName, date: todayDate(), form_level: level },
      { onConflict: 'child_name,date' }
    );
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-sm text-gray-500 flex-shrink-0">Dagsform:</span>
      <div className="flex gap-1.5">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => handleSelect(l.value)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
              form === l.value ? l.active : l.inactive
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
