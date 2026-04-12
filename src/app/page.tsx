import { createServiceClient } from '@/lib/supabase/server';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import Link from 'next/link';
import {
  formatDistance,
  formatPace,
  formatSleep,
  tsbColor,
  tsbLabel,
  aclrRisk,
  cn,
} from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatBadge } from '@/components/ui/StatBadge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

export const revalidate = 0;

function HrvTrend({ current, avg }: { current: number | null; avg: number | null }) {
  if (!current || !avg) return <Minus size={14} className="text-gray-500" />;
  const ratio = current / avg;
  if (ratio >= 0.97) return <TrendingUp size={14} className="text-green-400" />;
  if (ratio >= 0.90) return <Minus size={14} className="text-yellow-400" />;
  return <TrendingDown size={14} className="text-red-400" />;
}

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  const [
    { data: weekActivities },
    { data: recentWellness },
    { data: todayCheckin },
    { data: latestReport },
    { data: latestAlerts },
    { data: syncData },
    { data: recentActivities },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('type, distance_meters, duration_seconds, training_load, atl, ctl, tsb')
      .gte('start_date', weekStart)
      .lte('start_date', weekEnd + 'T23:59:59'),
    supabase
      .from('wellness')
      .select('date, hrv, resting_hr, sleep_seconds')
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false })
      .limit(7),
    supabase.from('daily_checkin').select('*').eq('date', today).maybeSingle(),
    supabase
      .from('ai_reports')
      .select('id, content, created_at, period_start, period_end')
      .eq('report_type', 'weekly')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ai_reports')
      .select('id, content, created_at')
      .eq('report_type', 'alert')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('sync_status')
      .select('*')
      .eq('source', 'intervals_icu')
      .maybeSingle(),
    supabase
      .from('activities')
      .select('id, name, type, start_date, distance_meters, avg_pace_per_km, avg_hr, atl, ctl, tsb')
      .order('start_date', { ascending: false })
      .limit(5),
  ]);

  // Weekly stats
  const runActivities = (weekActivities || []).filter((a) => a.type === 'Run');
  const weekRunKm = runActivities.reduce((sum, a) => sum + (a.distance_meters || 0), 0) / 1000;
  const strengthCount = (weekActivities || []).filter(
    (a) => a.type === 'WeightTraining' || a.type === 'Workout' || a.type === 'Strength'
  ).length;
  const weekTSS = (weekActivities || []).reduce((sum, a) => sum + (a.training_load || 0), 0);

  const todayWellness = recentWellness?.[0];
  const hrv7dAvg =
    recentWellness && recentWellness.length > 1
      ? recentWellness.slice(1).filter((w) => w.hrv).reduce((s, w) => s + (w.hrv || 0), 0) /
        Math.max(1, recentWellness.slice(1).filter((w) => w.hrv).length)
      : null;

  const latestActivity = recentActivities?.[0];
  const tsb = latestActivity?.tsb ?? null;
  const atl = latestActivity?.atl ?? null;
  const ctl = latestActivity?.ctl ?? null;
  const aclr = aclrRisk(atl, ctl);

  const sleepValues = (recentWellness || []).filter((w) => w.sleep_seconds);
  const sleepAvg = sleepValues.length
    ? sleepValues.reduce((s, w) => s + (w.sleep_seconds || 0), 0) / sleepValues.length
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {format(now, "EEEE d. MMMM", { locale: nb })}
          </h1>
          <p className="text-sm text-gray-400">Uke {format(now, 'w', { locale: nb })}</p>
        </div>
        <RefreshButton />
      </div>

      {/* Alerts */}
      {latestAlerts && latestAlerts.length > 0 && (
        <div className="space-y-2">
          {latestAlerts.map((alert) => (
            <Link key={alert.id} href={`/rapporter/${alert.id}`}>
              <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded-xl p-3 hover:bg-red-900/40 transition-colors">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-200 line-clamp-2">
                  {alert.content.split('\n')[0]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Weekly Overview */}
      <Card>
        <CardTitle>Ukens trening</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge label="Løping" value={weekRunKm.toFixed(1)} unit="km" />
          <StatBadge label="Styrke" value={strengthCount} unit="økter" />
          <StatBadge label="TSS" value={Math.round(weekTSS)} />
        </div>
      </Card>

      {/* Form / Training Load */}
      <Card>
        <CardTitle>Form & belastning</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge
            label="Form (TSB)"
            value={tsb !== null ? Math.round(tsb) : '—'}
            colorClass={tsbColor(tsb)}
            sub={tsbLabel(tsb)}
          />
          <StatBadge
            label="A:K ratio"
            value={atl && ctl ? (atl / ctl).toFixed(2) : '—'}
            colorClass={aclr.color}
            sub={aclr.label}
          />
          <StatBadge label="CTL" value={ctl ? Math.round(ctl) : '—'} sub="fitness" />
        </div>
      </Card>

      {/* Wellness */}
      <Card>
        <CardTitle>Restitusjon & helse</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 mb-1">HRV</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-white">
                {todayWellness?.hrv ? Math.round(todayWellness.hrv) : '—'}
              </span>
              <HrvTrend current={todayWellness?.hrv ?? null} avg={hrv7dAvg} />
            </div>
            <span className="text-xs text-gray-500 mt-0.5">
              snitt 7d: {hrv7dAvg ? Math.round(hrv7dAvg) : '—'}
            </span>
          </div>
          <StatBadge
            label="Hvile-HR"
            value={todayWellness?.resting_hr || '—'}
            unit={todayWellness?.resting_hr ? 'bpm' : undefined}
          />
          <StatBadge
            label="Søvnsnitt"
            value={sleepAvg ? formatSleep(sleepAvg) : '—'}
            sub="siste 7d"
          />
        </div>
        {todayCheckin && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Dagens check-in</p>
            <div className="flex gap-4 text-sm">
              {[
                { label: 'Energi', val: todayCheckin.energy },
                { label: 'Stølhet', val: todayCheckin.soreness },
                { label: 'Motivasjon', val: todayCheckin.motivation },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={cn(
                    'text-lg font-bold',
                    val && val >= 4 ? 'text-green-400' : val && val <= 2 ? 'text-red-400' : 'text-yellow-400'
                  )}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!todayCheckin && (
          <Link href="/checkin">
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm text-blue-400 hover:text-blue-300 transition-colors">
              <span>Ingen check-in i dag — logg det her</span>
              <ChevronRight size={14} />
            </div>
          </Link>
        )}
      </Card>

      {/* Latest AI Report */}
      {latestReport && (
        <Card>
          <CardTitle>Siste AI-rapport</CardTitle>
          <p className="text-xs text-gray-400 mb-2">
            {latestReport.period_start} – {latestReport.period_end}
          </p>
          <p className="text-sm text-gray-300 line-clamp-4">
            {latestReport.content.slice(0, 400)}...
          </p>
          <Link href={`/rapporter/${latestReport.id}`}>
            <div className="mt-2 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Les hele rapporten <ChevronRight size={14} />
            </div>
          </Link>
        </Card>
      )}

      {/* Recent Activities */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="mb-0">Siste aktiviteter</CardTitle>
          <Link href="/trening" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Se alle
          </Link>
        </div>
        {(recentActivities || []).length === 0 ? (
          <p className="text-sm text-gray-500">Ingen aktiviteter ennå. Kjør en synk for å hente data.</p>
        ) : (
          <div className="space-y-0">
            {(recentActivities || []).map((activity) => (
              <Link key={activity.id} href={`/trening/${activity.id}`}>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-700/60 last:border-0 hover:bg-gray-700/20 -mx-1 px-1 rounded transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.name || activity.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.start_date
                        ? format(new Date(activity.start_date), 'd. MMM', { locale: nb })
                        : '—'}
                      {activity.distance_meters && ` · ${formatDistance(activity.distance_meters)}`}
                      {activity.avg_pace_per_km && ` · ${formatPace(activity.avg_pace_per_km)}`}
                    </p>
                  </div>
                  {activity.avg_hr && (
                    <span className="text-xs text-gray-400 ml-2">{activity.avg_hr} bpm</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Sync status */}
      <p className="text-xs text-gray-600 text-center pb-2">
        {syncData?.last_synced_at
          ? `Synkronisert: ${format(new Date(syncData.last_synced_at), 'd. MMM HH:mm', { locale: nb })}`
          : 'Aldri synkronisert'}
        {syncData?.last_status === 'error' && (
          <span className="text-red-400 ml-2">• Feil</span>
        )}
      </p>
    </div>
  );
}
