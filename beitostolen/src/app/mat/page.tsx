'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Utensils, Clock, Lock, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

type Meal = {
  id: string;
  date: string;
  meal_name: string;
  serve_time: string;
  notes: string | null;
};

const DAYS_NO = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const DAYS_SHORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

const MEAL_TIMES = [
  { name: 'Frokost',   weekday: '08:00–09:00', weekend: '08:00–09:30' },
  { name: 'Lunsj',     weekday: '11:45–13:00', weekend: '12:00–14:00' },
  { name: 'Middag',    weekday: '15:30–17:00', weekend: '12:00–14:00' },
  { name: 'Kveldsmat', weekday: '18:00–22:00', weekend: '15:30–22:00', note: 'Selvbetjening i spisesalen' },
];

export default function MatPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meal_name: '',
    serve_time: '17:30',
    notes: '',
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const weekFrom = format(weekStart, 'yyyy-MM-dd');
  const weekTo = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  useEffect(() => {
    fetch(`/api/mat?from=${weekFrom}&to=${weekTo}`)
      .then((r) => r.json())
      .then((d) => setMeals(d.meals ?? []));
  }, [weekFrom, weekTo]);

  async function tryUnlock() {
    if (pinInput === '') return;
    const res = await fetch('/api/mat/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinInput }),
    });
    if (res.ok) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  async function addMeal() {
    if (!form.meal_name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/mat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, pin: pinInput }),
    });
    const data = await res.json();
    if (data.meal) {
      setMeals((prev) => [...prev, data.meal].sort((a, b) =>
        a.date.localeCompare(b.date) || a.serve_time.localeCompare(b.serve_time)
      ));
      setForm((f) => ({ ...f, meal_name: '', notes: '' }));
    }
    setLoading(false);
  }

  async function deleteMeal(id: string) {
    await fetch(`/api/mat?id=${id}&pin=${encodeURIComponent(pinInput)}`, { method: 'DELETE' });
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekLabel = format(weekStart, "'Uke' w · MMMM yyyy", { locale: nb });

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-10">
      <h2 className="text-xl font-bold text-gray-900">Mat</h2>
      <p className="text-sm text-gray-500 mt-0.5 mb-6">{weekLabel}</p>

      {/* Fixed meal times */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Faste spisetider</p>
        <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
          <div />
          <p className="text-xs font-semibold text-gray-500 text-center">Man–fre</p>
          <p className="text-xs font-semibold text-gray-500 text-center">Lør–søn</p>
          {MEAL_TIMES.map((m) => (
            <>
              <div key={m.name + '-label'}>
                <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                {m.note && <p className="text-[10px] text-gray-400 leading-tight">{m.note}</p>}
              </div>
              <p key={m.name + '-wday'} className="text-sm text-gray-600 tabular-nums text-center">{m.weekday}</p>
              <p key={m.name + '-wend'} className="text-sm text-gray-600 tabular-nums text-center">{m.weekend}</p>
            </>
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Middagsmeny denne uken</p>
      <div className="flex flex-col gap-3">
        {weekDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMeals = meals.filter((m) => m.date === dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`rounded-3xl border p-4 transition-all ${
                isToday
                  ? 'border-blue-200 bg-white shadow-[0_2px_12px_rgba(59,130,246,0.12)]'
                  : 'border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`rounded-2xl px-3 py-1.5 min-w-[60px] text-center ${isToday ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gray-100'}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                    {DAYS_SHORT[i]}
                  </p>
                  <p className={`text-base font-bold tabular-nums leading-tight ${isToday ? 'text-white' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                    {DAYS_NO[i]}
                  </p>
                </div>
              </div>

              {dayMeals.length === 0 ? (
                <p className="text-sm text-gray-400 pl-[68px]">Ikke registrert</p>
              ) : (
                <div className="flex flex-col gap-2 pl-[68px]">
                  {dayMeals.map((meal) => (
                    <div key={meal.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Utensils size={13} className="text-orange-400 flex-shrink-0" />
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{meal.meal_name}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{meal.serve_time.slice(0, 5)}</p>
                          {meal.notes && <span className="text-xs text-gray-400">· {meal.notes}</span>}
                        </div>
                      </div>
                      {unlocked && (
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin section */}
      <div className="mt-8">
        <button
          onClick={() => setShowAdmin((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-500 font-medium"
        >
          <Lock size={14} />
          Administrer meny
          {showAdmin ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdmin && !unlocked && (
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              placeholder="PIN"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
              className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-base focus:outline-none ${pinError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
            />
            <button
              onClick={tryUnlock}
              className="bg-blue-600 text-white px-5 rounded-xl font-semibold"
            >
              OK
            </button>
          </div>
        )}

        {unlocked && (
          <div className="mt-4 bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-semibold text-gray-700 mb-3">Legg til middag</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Dato</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Rett</label>
                <input
                  type="text"
                  placeholder="f.eks. Spagetti bolognese"
                  value={form.meal_name}
                  onChange={(e) => setForm((f) => ({ ...f, meal_name: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Serveringstid</label>
                <input
                  type="time"
                  value={form.serve_time}
                  onChange={(e) => setForm((f) => ({ ...f, serve_time: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Notater (valgfritt)</label>
                <input
                  type="text"
                  placeholder="f.eks. Glutenfri variant tilgjengelig"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={addMeal}
                disabled={loading || !form.meal_name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold rounded-2xl py-3.5 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-blue-500/20"
              >
                <Plus size={18} />
                {loading ? 'Lagrer...' : 'Legg til'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
