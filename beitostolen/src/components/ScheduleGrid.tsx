'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type Activity, type Absence } from '@/lib/supabase';
import { ActivityCard } from './ActivityCard';
import { AbsenceModal } from './AbsenceModal';
import { NameSetup } from './NameSetup';
import { format, addDays, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

type Props = { isFritid?: boolean };

export function ScheduleGrid({ isFritid = false }: Props) {
  const [childName, setChildName] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day;
  });
  const [selected, setSelected] = useState<Activity | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('childName');
    if (stored) setChildName(stored);
  }, []);

  useEffect(() => {
    const endpoint = isFritid ? '/api/fritid' : '/api/activities';
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        setActivities(d.activities ?? []);
        setAbsences(d.absences ?? []);
        setWeekStart(d.weekStart ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isFritid]);

  useEffect(() => {
    const channel = supabase
      .channel('absences-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAbsences((prev) => [...prev, payload.new as Absence]);
        } else if (payload.eventType === 'DELETE') {
          setAbsences((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
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
  const dayActivities = activities
    .filter((a) => a.day_of_week === selectedDay)
    .sort((a, b) => a.time_start.localeCompare(b.time_start));
  const availableDays = [...new Set(activities.map((a) => a.day_of_week))].sort();

  if (!childName) {
    return (
      <NameSetup
        storageKey="childName"
        label="Hva heter barnet ditt?"
        placeholder="Skriv barnets navn..."
        onSet={setChildName}
      />
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="px-4 pt-4 pb-1">
        <h2 className="text-xl font-bold text-gray-900">{isFritid ? 'Fritidsprogram' : 'Timeplan'}</h2>
        {weekStart && (
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(weekStart + 'T12:00:00'), "'Uke' w · MMMM yyyy", { locale: nb })}
          </p>
        )}
      </div>

      {/* Name display + change */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <p className="text-sm text-gray-500">
          Barn: <span className="font-medium text-gray-700">{childName}</span>
        </p>
        <button
          onClick={() => { localStorage.removeItem('childName'); setChildName(null); }}
          className="text-xs text-blue-600 font-medium py-1"
        >
          Bytt navn
        </button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 px-4 pt-3 scrollbar-hide">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 rounded-2xl px-4 py-2.5 min-w-[60px] bg-gray-100 animate-pulse h-14" />
          ))
        ) : availableDays.map((dayNum) => {
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

      {/* Activities */}
      <div className="px-4 pt-3 flex flex-col gap-2.5">
        {!loading && dayActivities.length === 0 ? (
          <div className="text-center py-20">
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
        ) : (
          dayActivities.map((activity) => (
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
