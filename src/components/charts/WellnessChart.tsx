'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface WellnessEntry {
  date: string;
  hrv: number | null;
  resting_hr: number | null;
  sleep_seconds: number | null;
  weight_kg?: number | null;
}

interface Props {
  wellness: WellnessEntry[];
}

export function WellnessChart({ wellness }: Props) {
  if (wellness.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen wellnessdata ennå</p>;
  }

  const data = wellness
    .filter((w) => w.hrv || w.resting_hr)
    .map((w) => ({
      date: format(new Date(w.date + 'T12:00:00'), 'd. MMM', { locale: nb }),
      HRV: w.hrv ? Math.round(w.hrv) : null,
      'Hvile-HR': w.resting_hr,
      Søvn: w.sleep_seconds ? Math.round(w.sleep_seconds / 3600 * 10) / 10 : null,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen HRV/HR-data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#9ca3af' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
        <Line type="monotone" dataKey="HRV" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="Hvile-HR" stroke="#ef4444" strokeWidth={1.5} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
