import { createServiceClient } from '@/lib/supabase/server';
import { subDays, format } from 'date-fns';
import { TrainingLoadChart } from '@/components/charts/TrainingLoadChart';
import { PaceChart } from '@/components/charts/PaceChart';
import { WellnessChart } from '@/components/charts/WellnessChart';
import { WeeklyVolumeChart } from '@/components/charts/WeeklyVolumeChart';
import { IntensityPieChart } from '@/components/charts/IntensityPieChart';
import { Card, CardTitle } from '@/components/ui/Card';

export const revalidate = 0;

export default async function AnalysePage() {
  const supabase = createServiceClient();

  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [
    { data: activities },
    { data: wellness },
  ] = await Promise.all([
    supabase
      .from('activities')
      .select('id, start_date, type, distance_meters, duration_seconds, avg_pace_per_km, avg_hr, max_hr, training_load, ctl, atl, tsb, calories')
      .gte('start_date', ninetyDaysAgo)
      .order('start_date'),
    supabase
      .from('wellness')
      .select('date, hrv, resting_hr, sleep_seconds, weight_kg')
      .gte('date', ninetyDaysAgo)
      .order('date'),
  ]);

  const runActivities = (activities || []).filter((a) => a.type === 'Run');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Analyse</h1>
      <p className="text-sm text-gray-400">Siste 90 dager</p>

      {/* Training load (ATL/CTL/TSB) */}
      <Card>
        <CardTitle>Belastning over tid (ATL / CTL / TSB)</CardTitle>
        <TrainingLoadChart activities={activities || []} />
      </Card>

      {/* Weekly volume */}
      <Card>
        <CardTitle>Ukentlig løpevolum (km)</CardTitle>
        <WeeklyVolumeChart activities={runActivities} />
      </Card>

      {/* Pace trend */}
      {runActivities.length > 0 && (
        <Card>
          <CardTitle>Pace-trend (løping)</CardTitle>
          <PaceChart activities={runActivities} />
        </Card>
      )}

      {/* Intensity distribution */}
      {runActivities.length > 0 && (
        <Card>
          <CardTitle>Intensitetsfordeling (HR-soner, siste 30 dager)</CardTitle>
          <IntensityPieChart
            activities={(activities || []).filter(
              (a) => a.type === 'Run' && a.start_date >= thirtyDaysAgo
            )}
          />
        </Card>
      )}

      {/* Wellness */}
      <Card>
        <CardTitle>HRV & hvile-HR</CardTitle>
        <WellnessChart wellness={wellness || []} />
      </Card>

      {/* Weight */}
      {(wellness || []).some((w) => w.weight_kg) && (
        <Card>
          <CardTitle>Vektutvikling</CardTitle>
          <WeightChart wellness={wellness || []} />
        </Card>
      )}
    </div>
  );
}

// Inline weight chart component (simple)
function WeightChart({ wellness }: { wellness: Array<{ date: string; weight_kg: number | null }> }) {
  const withWeight = wellness.filter((w) => w.weight_kg);
  if (withWeight.length === 0) return <p className="text-sm text-gray-500">Ingen vektdata</p>;

  const min = Math.min(...withWeight.map((w) => w.weight_kg!)) - 1;
  const max = Math.max(...withWeight.map((w) => w.weight_kg!)) + 1;

  return (
    <div className="text-sm text-gray-400">
      <div className="flex justify-between mb-1 text-xs text-gray-500">
        <span>Siste: {withWeight[withWeight.length - 1]?.weight_kg?.toFixed(1)} kg</span>
        <span>Min: {min.toFixed(1)} kg · Maks: {max.toFixed(1)} kg</span>
      </div>
      <WeightSvg data={withWeight} />
    </div>
  );
}

function WeightSvg({ data }: { data: Array<{ date: string; weight_kg: number | null }> }) {
  const W = 400;
  const H = 80;
  const min = Math.min(...data.map((d) => d.weight_kg!)) - 0.5;
  const max = Math.max(...data.map((d) => d.weight_kg!)) + 0.5;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.weight_kg! - min) / (max - min)) * H;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
