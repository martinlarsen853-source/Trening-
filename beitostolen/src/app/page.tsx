import { createClient } from '@supabase/supabase-js';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { Activity, Absence } from '@/lib/supabase';

export const revalidate = 0;

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [{ data: activities }, { data: absences }] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('is_fritid', false)
      .gte('week_start', weekStart)
      .lte('week_start', weekEnd)
      .order('day_of_week')
      .order('time_start'),
    supabase
      .from('absences')
      .select('*')
      .gte('registered_at', weekStart),
  ]);

  return {
    activities: (activities ?? []) as Activity[],
    absences: (absences ?? []) as Absence[],
    weekStart,
  };
}

export default async function SchedulePage() {
  const { activities, absences, weekStart } = await getData();

  const weekLabel = format(new Date(weekStart + 'T12:00:00'), "'Uke' w · MMMM yyyy", { locale: nb });

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Timeplan</h1>
        <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
      </div>
      <ScheduleGrid activities={activities} initialAbsences={absences} />
    </div>
  );
}
