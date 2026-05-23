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

export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; emoji: string } | null>(null);

  useEffect(() => {
    // Use the cached /api/weather (30-min server cache) instead of calling met.no directly
    fetch('/api/weather')
      .then((r) => r.json())
      .then(({ timeseries }) => {
        if (!timeseries?.length) return;
        const now = timeseries[0];
        setWeather({ temp: now.temp, emoji: symbolToEmoji(now.symbol) });
      })
      .catch(() => {});
  }, []);

  if (!weather) return null;

  return (
    <div className="flex flex-col items-center text-right">
      <span className="text-3xl leading-none">{weather.emoji}</span>
      <span className="text-white font-black text-xl tabular-nums leading-tight mt-0.5">{weather.temp}°</span>
      <span className="text-blue-300 text-[9px] font-bold uppercase tracking-widest mt-0.5">Beitostølen</span>
    </div>
  );
}
