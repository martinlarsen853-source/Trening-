/**
 * POST /api/sync
 * Syncs activities and wellness from Intervals.icu + weather from MET Norway.
 * Can be triggered manually or via cron (daily at 06:00 UTC via vercel.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import { createServiceClient } from '@/lib/supabase/server';
import {
  fetchActivities,
  fetchWellness,
  mapActivityToRow,
  mapWellnessToRow,
} from '@/lib/intervals';
import { fetchWeatherForTime } from '@/lib/weather';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const { data: syncData } = await supabase
      .from('sync_status')
      .select('last_synced_at')
      .eq('source', 'intervals_icu')
      .maybeSingle();

    const oldest = syncData?.last_synced_at
      ? format(subDays(new Date(syncData.last_synced_at), 1), 'yyyy-MM-dd')
      : format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const newest = format(new Date(), 'yyyy-MM-dd');

    const [activities, wellness] = await Promise.all([
      fetchActivities(oldest, newest),
      fetchWellness(oldest, newest),
    ]);

    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['default_lat', 'default_lon']);

    const settingsMap = Object.fromEntries(
      (appSettings || []).map((s) => [s.key, s.value ?? ''])
    );
    const defaultLat = parseFloat(settingsMap['default_lat'] || '63.43');
    const defaultLon = parseFloat(settingsMap['default_lon'] || '10.40');

    let activitiesInserted = 0;
    let wellnessInserted = 0;

    for (const activity of activities) {
      const row = mapActivityToRow(activity);

      try {
        const lat = activity.start_latlng?.[0] ?? defaultLat;
        const lon = activity.start_latlng?.[1] ?? defaultLon;
        const weather = await fetchWeatherForTime(lat, lon, new Date(activity.start_date_local));
        Object.assign(row, weather);
      } catch (weatherErr) {
        console.warn('Weather fetch failed for activity', activity.id, weatherErr);
      }

      const { error } = await supabase.from('activities').upsert(row, { onConflict: 'id' });
      if (!error) activitiesInserted++;
      else console.error('Activity upsert error:', error);
    }

    for (const w of wellness) {
      const row = mapWellnessToRow(w);
      const { error } = await supabase.from('wellness').upsert(row, { onConflict: 'date' });
      if (!error) wellnessInserted++;
      else console.error('Wellness upsert error:', error);
    }

    await supabase.from('sync_status').upsert({
      source: 'intervals_icu',
      last_synced_at: new Date().toISOString(),
      last_status: 'success',
      error_message: null,
    });

    return NextResponse.json({
      success: true,
      activities_synced: activitiesInserted,
      wellness_synced: wellnessInserted,
      period: { oldest, newest },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await supabase.from('sync_status').upsert({
      source: 'intervals_icu',
      last_synced_at: new Date().toISOString(),
      last_status: 'error',
      error_message: message,
    });

    console.error('Sync error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const req = new NextRequest('http://localhost/api/sync', { method: 'POST' });
  return POST(req);
}
