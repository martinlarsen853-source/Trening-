import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [{ data: activities, error: e1 }, { data: absences, error: e2 }] = await Promise.all([
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

  if (e1) console.error('activities error:', e1.message);
  if (e2) console.error('absences error:', e2.message);

  return NextResponse.json({
    activities: activities ?? [],
    absences: absences ?? [],
    weekStart,
  });
}
