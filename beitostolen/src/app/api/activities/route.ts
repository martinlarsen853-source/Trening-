import { NextRequest, NextResponse } from 'next/server';
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

// POST — create a new activity
export async function POST(req: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json() as {
    name: string; time_start: string; time_end: string;
    week_start: string; day_of_week: number; group_id: string;
    location?: string | null; notes?: string | null;
    load_level?: string | null; is_fritid?: boolean;
    target_child?: string | null;
    packing_items?: string[];
    staffIds?: string[];
    transition_flags?: string[];
    transition_note?: string | null;
  };

  const { data: act, error } = await supabase.from('activities').insert({
    name: body.name,
    time_start: body.time_start,
    time_end: body.time_end,
    week_start: body.week_start,
    day_of_week: body.day_of_week,
    group_id: body.group_id || null,
    location: body.location ?? null,
    notes: body.notes ?? null,
    load_level: body.load_level ?? null,
    is_fritid: body.is_fritid ?? false,
    target_child: body.target_child ?? null,
    packing_items: body.packing_items ?? [],
    transition_flags: body.transition_flags ?? [],
    transition_note: body.transition_note ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.staffIds?.length) {
    await supabase.from('activity_staff').insert(
      body.staffIds.map(staff_id => ({ activity_id: (act as { id: string }).id, staff_id }))
    );
  }

  return NextResponse.json({ activity: act });
}
