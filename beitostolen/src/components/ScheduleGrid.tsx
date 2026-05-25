'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type Activity, type Absence } from '@/lib/supabase';
import { ActivityCard } from './ActivityCard';
import { AbsenceModal } from './AbsenceModal';
import { NameSetup } from './NameSetup';
import { format, addDays, addWeeks, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Utensils, MessageCircle, Pencil } from 'lucide-react';
import { DagsformWidget } from './DagsformWidget';

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

// Meal slots — weekday vs weekend
function getMeals(dayOfWeek: number) {
  const isWeekend = dayOfWeek >= 6;
  if (isWeekend) {
    return [{ name: 'Lunsj / Middag', start: '12:00', end: '14:00' }];
  }
  return [
    { name: 'Lunsj', start: '11:45', end: '13:00' },
    { name: 'Middag', start: '15:30', end: '17:00' },
  ];
}

export function ScheduleGrid() {
  const [childName, setChildName] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fritidActivities, setFritidActivities] = useState<Activity[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<{ child: string; date: string; time: string; counselor: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [viewMode, setViewMode] = useState<'leder' | 'ledsager'>('ledsager');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // Compute the Monday of the target week (client-side, offset from current week)
  const targetWeekStart = format(
    addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    'yyyy-MM-dd'
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const role = user?.user_metadata?.role as string | undefined;
      const localLeder = localStorage.getItem('lederMode') === 'true';
      const staff = role === 'staff' || localLeder;
      setIsStaff(staff);
      if (staff) setViewMode('leder');

      const name = user?.user_metadata?.full_name as string | undefined;
      if (name) { setChildName(name); } else {
        const stored = localStorage.getItem('childName');
        if (stored) setChildName(stored);
      }
      setAuthLoading(false);
    }).catch(() => {
      const localLeder = localStorage.getItem('lederMode') === 'true';
      setIsStaff(localLeder);
      if (localLeder) setViewMode('leder');
      const stored = localStorage.getItem('childName');
      if (stored) setChildName(stored);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    fetch('/api/meetings')
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/activities?week=${targetWeekStart}`)
      .then((r) => r.json())
      .then((d) => {
        setActivities(d.activities ?? []);
        setFritidActivities(d.fritidActivities ?? []);
        setAbsences(d.absences ?? []);
        setWeekStart(d.weekStart ?? targetWeekStart);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [targetWeekStart]);

  // Snap selectedDay to a valid day once activities load
  useEffect(() => {
    if (loading) return;
    const days = [...new Set([
      ...activities.map((a) => a.day_of_week),
      ...fritidActivities.map((a) => a.day_of_week),
    ])].sort((a, b) => a - b);
    if (days.length > 0 && !days.includes(selectedDay)) {
      const todayNum = new Date().getDay() || 7;
      setSelectedDay(days.find((d) => d >= todayNum) ?? days[days.length - 1]);
    }
  }, [loading, activities, fritidActivities, selectedDay]);

  useEffect(() => {
    const channel = supabase
      .channel('absences-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, (payload) => {
        if (payload.eventType === 'INSERT') setAbsences((p) => [...p, payload.new as Absence]);
        else if (payload.eventType === 'DELETE') setAbsences((p) => p.filter((a) => a.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleAbsence = useCallback(async (activityId: string, name: string, existingId?: string) => {
    if (existingId) {
      await fetch(`/api/absences/${existingId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId, child_name: name }),
      });
    }
  }, []);

  const ws = weekStart ? new Date(weekStart + 'T12:00:00') : startOfWeek(new Date(), { weekStartsOn: 1 });
  const selectedDate = format(addDays(ws, selectedDay - 1), 'yyyy-MM-dd');
  const myMeeting = childName
    ? meetings.find((m) => m.child.toLowerCase() === childName.toLowerCase() && m.date === selectedDate)
    : null;

  // Only show days that actually have activities this week
  const allDays = [...new Set([
    ...activities.map((a) => a.day_of_week),
    ...fritidActivities.map((a) => a.day_of_week),
  ])].sort((a, b) => a - b);

  const dayActivities = activities
    .filter((a) => a.day_of_week === selectedDay)
    .filter((a) => !a.target_child || a.target_child.toLowerCase() === (childName ?? '').toLowerCase())
    .sort((a, b) => a.time_start.localeCompare(b.time_start));

  const dayFritid = fritidActivities
    .filter((a) => a.day_of_week === selectedDay)
    .sort((a, b) => a.time_start.localeCompare(b.time_start));

  const hasDinner = dayActivities.some((a) => a.is_dinner);
  const meals = getMeals(selectedDay).filter((m) => !(m.name === 'Middag' && hasDinner));

  // Insert meal cards into the activity list based on time
  type ListItem =
    | { kind: 'activity'; data: Activity }
    | { kind: 'meal'; name: string; start: string; end: string }
    | { kind: 'meeting'; time: string; counselor: string };

  const isWeekend = selectedDay >= 6;

  const mainList: ListItem[] = [
    ...dayActivities.map((a) => ({ kind: 'activity' as const, data: a })),
    // On weekends there's no programme/leisure split — merge everything chronologically
    ...(isWeekend ? dayFritid.map((a) => ({ kind: 'activity' as const, data: a })) : []),
    ...meals.map((m) => ({ kind: 'meal' as const, name: m.name, start: m.start, end: m.end })),
    ...(myMeeting ? [{ kind: 'meeting' as const, time: myMeeting.time, counselor: myMeeting.counselor }] : []),
  ].sort((a, b) => {
    const ta = a.kind === 'activity' ? a.data.time_start : (a.kind === 'meeting' ? a.time + ':00' : a.start + ':00');
    const tb = b.kind === 'activity' ? b.data.time_start : (b.kind === 'meeting' ? b.time + ':00' : b.start + ':00');
    return ta.localeCompare(tb);
  });

  if (authLoading) return (
    <div className="flex items-center justify-center pt-20">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!childName) return null;

  return (
    <div>
      {/* Page header */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Timeplan</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(ws, "'Uke' w · MMMM yyyy", { locale: nb })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white ring-1 ring-gray-100 text-gray-500 active:scale-95 transition-all"
            aria-label="Forrige uke"
          >
            ‹
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] font-semibold text-blue-600 px-2"
            >
              I dag
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white ring-1 ring-gray-100 text-gray-500 active:scale-95 transition-all"
            aria-label="Neste uke"
          >
            ›
          </button>
        </div>
      </div>

      {/* Leder/Ledsager toggle — only for staff */}
      {isStaff && (
        <div className="px-4 pt-2 pb-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {viewMode === 'leder' ? 'Ledermodus' : 'Ledsagermodus'}
            </p>
            <p className="text-xs text-gray-400">
              {viewMode === 'leder' ? 'Dagsform og alle data synlig' : 'Standard foreldrevisning'}
            </p>
          </div>
          <button
            onClick={() => setViewMode((m) => m === 'leder' ? 'ledsager' : 'leder')}
            className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors duration-200 ${
              viewMode === 'leder' ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-label="Bytt visningsmodus"
          >
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
              viewMode === 'leder' ? 'translate-x-7' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      )}

      {/* Child name — editable in leder mode */}
      <div className="px-4 pt-2 pb-0">
        {isStaff && viewMode === 'leder' ? (
          editingName ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Barn:</span>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setChildName(nameInput); setEditingName(false); } }}
                className="text-sm font-medium text-gray-700 border-b border-blue-400 outline-none bg-transparent w-32"
                autoFocus
              />
              <button onClick={() => { setChildName(nameInput); setEditingName(false); }}
                className="text-xs text-blue-600 font-semibold">OK</button>
              <button onClick={() => setEditingName(false)}
                className="text-xs text-gray-400">Avbryt</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-gray-500">
                Barn: <span className="font-medium text-gray-700">{childName}</span>
              </p>
              <button
                onClick={() => { setNameInput(childName ?? ''); setEditingName(true); }}
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="Bytt barnenavn"
              >
                <Pencil size={13} />
              </button>
            </div>
          )
        ) : (
          <p className="text-sm text-gray-500">
            Barn: <span className="font-medium text-gray-700">{childName}</span>
          </p>
        )}
      </div>

      {/* Dagsform — alltid synlig for foreldre (setter status), leder ser oversikt over alle */}
      {childName && (
        <DagsformWidget childName={childName} isLeder={isStaff && viewMode === 'leder'} />
      )}

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 px-4 pt-3 scrollbar-hide">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 rounded-2xl px-4 py-2.5 min-w-[60px] bg-gray-100 animate-pulse h-14" />
            ))
          : allDays.map((dayNum) => {
              const date = addDays(ws, dayNum - 1);
              const isToday = new Date().getDay() === (dayNum === 7 ? 0 : dayNum);
              const sel = selectedDay === dayNum;
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-2.5 min-w-[60px] transition-all active:scale-95 ${
                    sel
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                      : isToday
                      ? 'bg-white text-blue-700 ring-1 ring-blue-200'
                      : 'bg-white text-gray-600 ring-1 ring-gray-100'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${sel ? 'text-blue-100' : isToday ? 'text-blue-500' : 'text-gray-400'}`}>
                    {DAYS[dayNum - 1]}
                  </span>
                  <span className="text-lg font-bold tabular-nums leading-tight">
                    {format(date, 'd', { locale: nb })}
                  </span>
                </button>
              );
            })}
      </div>

      {/* Main activities + meals */}
      <div className="px-4 pt-2 flex flex-col gap-2.5">
        {!loading && mainList.length === 0 ? (
          <EmptyDay />
        ) : (
          mainList.map((item, i) =>
            item.kind === 'meal' ? (
              <MealCard key={`meal-${i}`} name={item.name} start={item.start} end={item.end} />
            ) : item.kind === 'meeting' ? (
              <MeetingCard key="meeting" time={item.time} counselor={item.counselor} childName={childName!} />
            ) : (
              <ActivityCard
                key={item.data.id}
                activity={item.data}
                absences={absences}
                childName={childName}
                onClick={() => setSelected(item.data)}
              />
            )
          )
        )}
      </div>

      {/* Fritid separator + activities — hidden on weekends (merged into main list) */}
      {!loading && !isWeekend && (
        <div className="mt-6 mb-2">
          {/* Big divider */}
          <div className="relative mx-4 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-purple-100" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-5 py-2 rounded-full uppercase tracking-widest shadow-md shadow-purple-500/25">
                Fritidsprogram
              </div>
            </div>
          </div>

          <div className="px-4 flex flex-col gap-2.5">
            {dayFritid.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Ingen fritidsaktiviteter denne dagen</p>
            ) : (
              dayFritid.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  absences={absences}
                  childName={childName}
                  onClick={() => setSelected(activity)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {selected && (
        <AbsenceModal
          activity={selected}
          absences={absences}
          childName={childName}
          onClose={() => setSelected(null)}
          onToggle={toggleAbsence}
        />
      )}
    </div>
  );
}

function MealCard({ name, start, end }: { name: string; start: string; end: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-orange-100 bg-orange-50/60 px-4 py-3">
      <div className="flex flex-col items-center justify-center bg-orange-100 rounded-2xl px-3 py-2 min-w-[68px]">
        <span className="text-base font-bold text-orange-800 tabular-nums leading-tight">{start}</span>
        <span className="text-[10px] font-medium text-orange-400 tabular-nums">— {end}</span>
      </div>
      <div className="flex items-center gap-2">
        <Utensils size={15} className="text-orange-400 flex-shrink-0" />
        <p className="font-bold text-orange-800 text-base">{name}</p>
      </div>
    </div>
  );
}

function MeetingCard({ time, counselor, childName }: { time: string; counselor: string; childName: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-green-200 bg-green-50/70 px-4 py-3">
      <div className="flex flex-col items-center justify-center bg-green-100 rounded-2xl px-3 py-2 min-w-[68px]">
        <span className="text-base font-bold text-green-800 tabular-nums leading-tight">{time}</span>
        <span className="text-[10px] font-medium text-green-500">Samtale</span>
      </div>
      <div className="flex items-start gap-2 flex-1">
        <MessageCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-green-800 text-base leading-tight">Oppfølgingssamtale</p>
          <p className="text-sm text-green-700 mt-0.5">{childName} · med {counselor}</p>
          <p className="text-xs text-green-600 mt-0.5">AKV-bygget, legesekretærkontoret</p>
        </div>
      </div>
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Fri dag</p>
      <p className="text-gray-400 text-sm mt-1">Ingen planlagte aktiviteter</p>
    </div>
  );
}
