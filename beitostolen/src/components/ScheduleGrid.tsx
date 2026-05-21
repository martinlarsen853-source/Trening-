'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type Activity, type Absence } from '@/lib/supabase';
import { ActivityCard } from './ActivityCard';
import { AbsenceModal } from './AbsenceModal';
import { NameSetup } from './NameSetup';
import { format, addDays, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

type Props = {
  activities: Activity[];
  initialAbsences: Absence[];
  isFritid?: boolean;
};

export function ScheduleGrid({ activities, initialAbsences, isFritid = false }: Props) {
  const [childName, setChildName] = useState<string | null>(null);
  const [absences, setAbsences] = useState<Absence[]>(initialAbsences);
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

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
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
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-4 pt-4 scrollbar-hide">
        {availableDays.map((dayNum) => {
          const date = addDays(weekStart, dayNum - 1);
          const isToday = new Date().getDay() === (dayNum === 7 ? 0 : dayNum);
          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className={`flex-shrink-0 flex flex-col items-center rounded-xl px-4 py-2 transition-colors ${
                selectedDay === dayNum
                  ? 'bg-blue-600 text-white'
                  : isToday
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <span className="text-xs font-medium">{DAYS[dayNum - 1]}</span>
              <span className="text-sm font-bold">{format(date, 'd', { locale: nb })}</span>
            </button>
          );
        })}
      </div>

      {/* Activities */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {dayActivities.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg">Ingen aktiviteter denne dagen</p>
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
