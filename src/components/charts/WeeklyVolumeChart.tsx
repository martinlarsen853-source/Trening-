'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { startOfWeek, format, eachWeekOfInterval, subWeeks } from 'date-fns';
import { nb } from 'date-fns/locale';

interface Activity {
  start_date: string;
  distance_meters: number | null;
}

interface Props {
  activities: Activity[];
  weeklyGoalKm?: number;
}

export function WeeklyVolumeChart({ activities, weeklyGoalKm = 60 }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen løpedata ennå</p>;
  }

  const weeks = eachWeekOfInterval(
    {
      start: subWeeks(new Date(), 12),
      end: new Date(),
    },
    { weekStartsOn: 1 }
  );

  const data = weeks.map((weekStart) => {
    const weekLabel = format(weekStart, "'Uke' w", { locale: nb });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const km = activities
      .filter((a) => {
        const d = new Date(a.start_date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, a) => sum + (a.distance_meters || 0) / 1000, 0);

    return { week: weekLabel, km: Math.round(km * 10) / 10 };
  });

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          labelStyle={{ color: '#e5e7eb' }}
          formatter={(val) => [`${val} km`, 'Løpevolum']}
        />
        <ReferenceLine y={weeklyGoalKm} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Mål', fill: '#f59e0b', fontSize: 10 }} />
        <Bar dataKey="km" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
