import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  formatDistance,
  formatPace,
  formatDuration,
  tsbColor,
  tsbLabel,
  aclrRisk,
} from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatBadge } from '@/components/ui/StatBadge';
import { ChevronLeft, Wind, Thermometer, CloudRain } from 'lucide-react';

export const revalidate = 0;

interface Interval {
  label?: string;
  type?: string;
  moving_time?: number;
  average_speed?: number;
  average_heartrate?: number;
  distance?: number;
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: activity, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !activity) notFound();

  const tsb = activity.tsb;
  const atl = activity.atl;
  const ctl = activity.ctl;
  const aclr = aclrRisk(atl, ctl);

  const intervals = activity.intervals_json as Interval[] | null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/trening" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{activity.name || activity.type}</h1>
          <p className="text-sm text-gray-400">
            {activity.start_date
              ? format(new Date(activity.start_date), "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })
              : '—'}
          </p>
        </div>
      </div>

      {/* Main stats */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge label="Distanse" value={activity.distance_meters ? (activity.distance_meters / 1000).toFixed(2) : '—'} unit="km" />
          <StatBadge label="Tid" value={formatDuration(activity.duration_seconds)} />
          <StatBadge label="Pace" value={formatPace(activity.avg_pace_per_km)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
          <StatBadge label="Snitt HR" value={activity.avg_hr || '—'} unit={activity.avg_hr ? 'bpm' : undefined} />
          <StatBadge label="Maks HR" value={activity.max_hr || '—'} unit={activity.max_hr ? 'bpm' : undefined} />
          <StatBadge label="Kalorier" value={activity.calories || '—'} unit={activity.calories ? 'kcal' : undefined} />
        </div>
      </Card>

      {/* Training load */}
      <Card>
        <CardTitle>Belastning & form</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge label="TSS" value={activity.training_load ? Math.round(activity.training_load) : '—'} />
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
        </div>
      </Card>

      {/* Weather */}
      {(activity.temperature_c !== null || activity.wind_speed_ms !== null) && (
        <Card>
          <CardTitle>Vær under økt</CardTitle>
          <div className="flex gap-6 text-sm">
            {activity.temperature_c !== null && (
              <div className="flex items-center gap-1.5 text-gray-300">
                <Thermometer size={14} className="text-orange-400" />
                {Math.round(activity.temperature_c)}°C
              </div>
            )}
            {activity.wind_speed_ms !== null && (
              <div className="flex items-center gap-1.5 text-gray-300">
                <Wind size={14} className="text-blue-400" />
                {activity.wind_speed_ms.toFixed(1)} m/s
              </div>
            )}
            {activity.precipitation_mm !== null && activity.precipitation_mm > 0 && (
              <div className="flex items-center gap-1.5 text-gray-300">
                <CloudRain size={14} className="text-blue-300" />
                {activity.precipitation_mm.toFixed(1)} mm
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Intervals/Splits */}
      {intervals && intervals.length > 0 && (
        <Card>
          <CardTitle>Splits / Intervaller</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left pb-2 pr-3">#</th>
                  <th className="text-left pb-2 pr-3">Tid</th>
                  <th className="text-left pb-2 pr-3">Dist.</th>
                  <th className="text-left pb-2 pr-3">Pace</th>
                  <th className="text-left pb-2">HR</th>
                </tr>
              </thead>
              <tbody>
                {intervals.map((interval, idx) => {
                  const paceFromSpeed =
                    interval.average_speed && interval.average_speed > 0
                      ? 1000 / interval.average_speed
                      : null;
                  return (
                    <tr key={idx} className="border-b border-gray-700/40 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-500">{idx + 1}</td>
                      <td className="py-1.5 pr-3 text-gray-300 tabular-nums">
                        {formatDuration(interval.moving_time || null)}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-300 tabular-nums">
                        {interval.distance ? `${(interval.distance / 1000).toFixed(2)} km` : '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-300 tabular-nums">
                        {formatPace(paceFromSpeed)}
                      </td>
                      <td className="py-1.5 text-gray-300 tabular-nums">
                        {interval.average_heartrate
                          ? `${Math.round(interval.average_heartrate)} bpm`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
