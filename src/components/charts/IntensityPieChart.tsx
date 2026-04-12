'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Activity {
  avg_hr: number | null;
  max_hr: number | null;
  duration_seconds: number | null;
}

interface Props {
  activities: Activity[];
  maxHR?: number;
}

// HR zone boundaries as % of max HR
const ZONES = [
  { name: 'Sone 1 (Recovery)', min: 0, max: 0.6, color: '#6b7280' },
  { name: 'Sone 2 (Aerob)', min: 0.6, max: 0.7, color: '#3b82f6' },
  { name: 'Sone 3 (Tempo)', min: 0.7, max: 0.8, color: '#10b981' },
  { name: 'Sone 4 (Terskel)', min: 0.8, max: 0.9, color: '#f59e0b' },
  { name: 'Sone 5 (VO2max)', min: 0.9, max: 1.0, color: '#ef4444' },
];

export function IntensityPieChart({ activities, maxHR = 190 }: Props) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen data for perioden</p>;
  }

  // Estimate zone distribution based on avg HR
  const zoneTotals = ZONES.map((zone) => ({ ...zone, minutes: 0 }));

  for (const activity of activities) {
    if (!activity.avg_hr || !activity.duration_seconds) continue;
    const hrFraction = activity.avg_hr / maxHR;
    const minutes = activity.duration_seconds / 60;

    // Find zone
    const zone = ZONES.findIndex((z) => hrFraction >= z.min && hrFraction < z.max);
    if (zone >= 0) {
      zoneTotals[zone].minutes += minutes;
    } else if (hrFraction >= 0.9) {
      zoneTotals[4].minutes += minutes;
    } else {
      zoneTotals[0].minutes += minutes;
    }
  }

  const data = zoneTotals
    .filter((z) => z.minutes > 0)
    .map((z) => ({
      name: z.name,
      value: Math.round(z.minutes),
      color: z.color,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">Ingen HR-data for perioden</p>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const zone12 = (data.slice(0, 2).reduce((s, d) => s + d.value, 0) / total * 100).toFixed(0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            formatter={(val) => [`${val} min`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: '#9ca3af' }}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-gray-400 mt-1">
        Sone 1+2 (lav intensitet): <span className={parseInt(zone12) >= 80 ? 'text-green-400' : 'text-yellow-400'}>{zone12}%</span>
        <span className="text-gray-500"> (mål: 80%)</span>
      </p>
    </div>
  );
}
