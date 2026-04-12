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
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface Activity {
  start_date: string;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
}

interface Props {
  activities: Activity[];
}

export function TrainingLoadChart({ activities }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen data ennå</p>;
  }

  const data = activities
    .filter((a) => a.ctl !== null || a.atl !== null)
    .map((a) => ({
      date: format(new Date(a.start_date), 'd. MMM', { locale: nb }),
      CTL: a.ctl ? Math.round(a.ctl) : null,
      ATL: a.atl ? Math.round(a.atl) : null,
      TSB: a.tsb ? Math.round(a.tsb) : null,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen belastningsdata ennå</p>;
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
        <ReferenceLine y={0} stroke="#4b5563" />
        <Line type="monotone" dataKey="CTL" stroke="#3b82f6" strokeWidth={2} dot={false} name="CTL (fitness)" />
        <Line type="monotone" dataKey="ATL" stroke="#f59e0b" strokeWidth={2} dot={false} name="ATL (belastning)" />
        <Line type="monotone" dataKey="TSB" stroke="#10b981" strokeWidth={1.5} dot={false} name="TSB (form)" strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
