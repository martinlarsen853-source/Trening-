import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week') ?? '';
  const childName = (req.nextUrl.searchParams.get('childName') ?? '').trim().toLowerCase();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return NextResponse.json({ error: 'invalid week' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const weekEnd = (() => {
    const d = new Date(week + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  const [{ data: acts }, { data: abs }] = await Promise.all([
    supabase
      .from('activities')
      .select(`
        id,name,location,notes,time_start,time_end,day_of_week,
        group_name,target_child,is_adult_meeting,load_level,
        staff_name,staff_id,is_fritid,
        activity_staff(staff_id, staff:staff_id(id,name,photo_url))
      `)
      .gte('week_start', week)
      .lte('week_start', weekEnd)
      .order('day_of_week')
      .order('time_start'),
    supabase
      .from('absences')
      .select('activity_id,child_name')
      .gte('registered_at', week),
  ]);

  // Build absence lookup: activity_id → child names
  const absMap = new Map<string, string[]>();
  for (const a of (abs ?? [])) {
    if (!absMap.has(a.activity_id)) absMap.set(a.activity_id, []);
    absMap.get(a.activity_id)!.push(a.child_name);
  }

  // Group by day
  const dayMap = new Map<number, { main: object[]; fritid: object[] }>();
  for (const act of (acts ?? [])) {
    if (!dayMap.has(act.day_of_week)) dayMap.set(act.day_of_week, { main: [], fritid: [] });
    const relevantAbsences = absMap.get(act.id) ?? [];
    const staff = ((act.activity_staff ?? []) as unknown as { staff: { id: string; name: string; photo_url: string | null } | null }[])
      .filter(r => r.staff != null)
      .map(r => r.staff!);
    const item = {
      id: act.id,
      name: act.name,
      location: act.location,
      notes: act.notes,
      time_start: act.time_start,
      time_end: act.time_end,
      day_of_week: act.day_of_week,
      group_name: act.group_name,
      target_child: act.target_child,
      is_adult_meeting: act.is_adult_meeting,
      load_level: act.load_level,
      staff_name: act.staff_name,
      staff_id: act.staff_id,
      staff,
      myAbsence: childName ? relevantAbsences.map(n => n.toLowerCase()).includes(childName) : false,
      relevantAbsences,
    };
    const day = dayMap.get(act.day_of_week)!;
    (act.is_fritid ? day.fritid : day.main).push(item);
  }

  const days = Array.from(dayMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayOfWeek, data]) => ({ dayOfWeek, ...data }));

  return NextResponse.json({ weekStart: week, days });
}
