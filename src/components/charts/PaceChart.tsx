'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { formatPace } from '@/lib/utils';

interface Activity {
  start_date: string;
  avg_pace_per_km: number | null;
  distance_meters: number | null;
  name?: string | null;
}

interface Props {
  activities: Activity[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; distance: number; name: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-xs">
      <p className="text-gray-400">{d.payload.date}</p>
      <p className="text-white font-medium">{formatPace(d.value)}</p>
      <p className="text-gray-400">{d.payload.distance} km</p>
    </div>
  );
}

export function PaceChart({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen løpedata ennå</p>;
  }

  const data = activities
    .filter((a) => a.avg_pace_per_km && a.avg_pace_per_km < 600) // filter out unrealistic paces
    .map((a) => ({
      date: format(new Date(a.start_date), 'd. MMM', { locale: nb }),
      pace: a.avg_pace_per_km!,
      distance: a.distance_meters ? (a.distance_meters / 1000).toFixed(1) : 0,
      name: a.name || 'Løpetur',
    }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen pacedata</p>;
  }

  // Y-axis: invert (lower pace = faster = better), show as mm:ss
  const minPace = Math.min(...data.map((d) => d.pace));
  const maxPace = Math.max(...data.map((d) => d.pace));

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPace - 10, maxPace + 10]}
            reversed
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickFormatter={(v) => formatPace(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-1">Lavere = raskere pace</p>
    </div>
  );
}
