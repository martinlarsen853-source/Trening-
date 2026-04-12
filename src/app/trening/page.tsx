import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import Link from 'next/link';
import { formatDistance, formatPace, formatDuration, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Activity, Dumbbell, ChevronRight } from 'lucide-react';

export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  Run: 'Løping',
  Ride: 'Sykling',
  Swim: 'Svømming',
  Walk: 'Gange',
  Hike: 'Fjellturer',
  VirtualRide: 'Virtuell sykling',
  WeightTraining: 'Styrke',
  Workout: 'Styrke',
  Strength: 'Styrke',
};

function typeIcon(type: string) {
  if (type === 'WeightTraining' || type === 'Workout' || type === 'Strength') {
    return <Dumbbell size={14} className="text-purple-400" />;
  }
  return <Activity size={14} className="text-blue-400" />;
}

function typeColor(type: string) {
  if (type === 'Run') return 'text-orange-400';
  if (type === 'Ride' || type === 'VirtualRide') return 'text-blue-400';
  if (type === 'WeightTraining' || type === 'Workout' || type === 'Strength') return 'text-purple-400';
  return 'text-gray-400';
}

export default async function TreningPage() {
  const supabase = createServiceClient();

  const [{ data: activities }, { data: strengthSessions }] = await Promise.all([
    supabase
      .from('activities')
      .select('id, name, type, start_date, distance_meters, duration_seconds, avg_pace_per_km, avg_hr, training_load, tsb, temperature_c, weather_symbol')
      .order('start_date', { ascending: false })
      .limit(60),
    supabase
      .from('strength_sessions')
      .select('id, title, start_time, end_time')
      .order('start_time', { ascending: false })
      .limit(30),
  ]);

  // Group by month
  type CombinedItem = {
    id: string;
    sortDate: string;
    isStrength: boolean;
    name: string;
    type: string;
    date: string;
    distance?: number | null;
    duration?: number | null;
    pace?: number | null;
    hr?: number | null;
    load?: number | null;
    tsb?: number | null;
    temp?: number | null;
  };

  const combined: CombinedItem[] = [
    ...(activities || []).map((a) => ({
      id: a.id,
      sortDate: a.start_date,
      isStrength: false,
      name: a.name || TYPE_LABELS[a.type] || a.type,
      type: a.type,
      date: a.start_date,
      distance: a.distance_meters,
      duration: a.duration_seconds,
      pace: a.avg_pace_per_km,
      hr: a.avg_hr,
      load: a.training_load,
      tsb: a.tsb,
      temp: a.temperature_c,
    })),
    ...(strengthSessions || []).map((s) => ({
      id: s.id,
      sortDate: s.start_time,
      isStrength: true,
      name: s.title,
      type: 'WeightTraining',
      date: s.start_time,
      distance: null,
      duration: s.end_time
        ? Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000)
        : null,
    })),
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  // Group by month
  const byMonth = combined.reduce<Record<string, CombinedItem[]>>((acc, item) => {
    const month = format(new Date(item.sortDate), 'MMMM yyyy', { locale: nb });
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Treningslogg</h1>

      {Object.keys(byMonth).length === 0 && (
        <Card>
          <p className="text-sm text-gray-500 text-center py-4">
            Ingen aktiviteter ennå. Synkroniser fra Intervals.icu eller last opp Hevy CSV.
          </p>
        </Card>
      )}

      {Object.entries(byMonth).map(([month, items]) => (
        <div key={month}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">
            {month}
          </h2>
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={`${item.isStrength ? 's' : 'a'}-${item.id}`}
                href={item.isStrength ? `/trening/styrke/${item.id}` : `/trening/${item.id}`}
              >
                <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-500 transition-colors">
                  <div className="shrink-0">{typeIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <span className={cn('text-xs font-medium', typeColor(item.type))}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{format(new Date(item.date), 'd. MMM', { locale: nb })}</span>
                      {item.distance && <span>· {formatDistance(item.distance)}</span>}
                      {item.pace && <span>· {formatPace(item.pace)}</span>}
                      {item.duration && !item.pace && <span>· {formatDuration(item.duration)}</span>}
                      {item.hr && <span>· {item.hr} bpm</span>}
                      {item.temp !== undefined && item.temp !== null && (
                        <span>· {Math.round(item.temp)}°C</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {item.load && (
                      <span className="text-xs text-gray-400">{Math.round(item.load)} TSS</span>
                    )}
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
