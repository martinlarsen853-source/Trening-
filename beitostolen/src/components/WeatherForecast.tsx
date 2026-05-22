'use client';

import { useEffect, useState } from 'react';

function symbolToEmoji(symbol: string): string {
  if (symbol.includes('clearsky')) return symbol.includes('night') ? '🌙' : '☀️';
  if (symbol.includes('fair')) return '🌤️';
  if (symbol.includes('partlycloudy')) return '⛅';
  if (symbol.includes('cloudy')) return '☁️';
  if (symbol.includes('fog')) return '🌫️';
  if (symbol.includes('thunder')) return '⛈️';
  if (symbol.includes('snow') || symbol.includes('blizzard')) return '❄️';
  if (symbol.includes('sleet')) return '🌨️';
  if (symbol.includes('rain') || symbol.includes('shower')) return '🌧️';
  return '🌡️';
}

function toCESTTime(isoUtc: string): { label: string; ms: number } {
  const ms = new Date(isoUtc).getTime() + 2 * 60 * 60 * 1000;
  const d = new Date(ms);
  const label = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { label, ms };
}

export function WeatherForecast() {
  const [entries, setEntries] = useState<{ time: string; label: string; temp: number; emoji: string }[]>([]);

  useEffect(() => {
    fetch('/api/weather')
      .then((r) => r.json())
      .then(({ timeseries }) => {
        if (!timeseries?.length) return;

        // Current CEST hour start (floor to hour)
        const nowMs = Date.now() + 2 * 60 * 60 * 1000;
        const nowHourMs = Math.floor(nowMs / 3_600_000) * 3_600_000;

        const relevant = timeseries
          .filter((e: { time: string }) => {
            const { ms } = toCESTTime(e.time);
            return ms >= nowHourMs;
          })
          .slice(0, 8)
          .map((e: { time: string; temp: number; symbol: string }) => {
            const { label } = toCESTTime(e.time);
            return { time: e.time, label, temp: e.temp, emoji: symbolToEmoji(e.symbol) };
          });

        setEntries(relevant);
      })
      .catch(() => {});
  }, []);

  if (!entries.length) return null;

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {entries.map((e, i) => (
          <div
            key={e.time}
            className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-3 py-2.5 min-w-[56px] transition-all ${
              i === 0
                ? 'bg-blue-600 shadow-md shadow-blue-500/25'
                : 'bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wide ${i === 0 ? 'text-blue-200' : 'text-gray-400'}`}>
              {i === 0 ? 'Nå' : e.label}
            </span>
            <span className="text-xl leading-snug mt-0.5">{e.emoji}</span>
            <span className={`text-sm font-black tabular-nums leading-tight ${i === 0 ? 'text-white' : 'text-gray-800'}`}>
              {e.temp}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
