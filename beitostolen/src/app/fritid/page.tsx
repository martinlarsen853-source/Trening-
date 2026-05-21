import { createClient } from '@supabase/supabase-js';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { SUPABASE_URL, SUPABASE_ANON_KEY, type Activity, type Absence } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getData() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [{ data: activities }, { data: absences }] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('is_fritid', true)
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

export default async function FritidPage() {
  const { activities, absences, weekStart } = await getData();
  const weekLabel = format(new Date(weekStart + 'T12:00:00'), "'Uke' w · MMMM yyyy", { locale: nb });

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900">Fritidsprogram</h2>
        <p className="text-sm text-gray-500 mt-0.5">{weekLabel}</p>
      </div>
      <ScheduleGrid activities={activities} initialAbsences={absences} isFritid />
    </div>
  );
}
