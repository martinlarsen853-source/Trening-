import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfWeek, endOfWeek, format, parseISO, isValid } from 'date-fns';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Cache response at the CDN/browser level for 30s, serve stale for 2 min while revalidating
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' };

export async function GET(req: Request) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Allow client to request a specific week via ?week=YYYY-MM-DD
  const { searchParams } = new URL(req.url);
  const weekParam = searchParams.get('week');
  const baseDate = weekParam && isValid(parseISO(weekParam)) ? parseISO(weekParam) : new Date();

  const weekStart = format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

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
  }, { headers: CACHE_HEADERS });
}
