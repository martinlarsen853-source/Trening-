import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [{ data: activities }, { data: fritidActivities }, { data: absences }] = await Promise.all([
    supabase
      .from('activities').select('*').eq('is_fritid', false)
      .gte('week_start', weekStart).lte('week_start', weekEnd)
      .order('day_of_week').order('time_start'),
    supabase
      .from('activities').select('*').eq('is_fritid', true)
      .gte('week_start', weekStart).lte('week_start', weekEnd)
      .order('day_of_week').order('time_start'),
    supabase
      .from('absences').select('*').gte('registered_at', weekStart),
  ]);

  return NextResponse.json({
    activities: activities ?? [],
    fritidActivities: fritidActivities ?? [],
    absences: absences ?? [],
    weekStart,
  });
}
