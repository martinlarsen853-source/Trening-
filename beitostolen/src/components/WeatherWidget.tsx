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
    fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=61.3002&lon=8.9303',
      { headers: { 'User-Agent': 'beitostolen-2c-app/1.0' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const now = data.properties.timeseries[0];
        const temp = Math.round(now.data.instant.details.air_temperature);
        const symbol: string = now.data.next_1_hours?.summary?.symbol_code ?? '';
        setWeather({ temp, emoji: symbolToEmoji(symbol) });
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
