import { Suspense } from 'react';

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

async function WeatherData() {
  try {
    const res = await fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=61.3002&lon=8.9303',
      {
        headers: { 'User-Agent': 'beitostolen-2c-app/1.0 github.com/martinlarsen853-source/Trening-' },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const now = data.properties.timeseries[0];
    const temp = Math.round(now.data.instant.details.air_temperature);
    const symbol: string = now.data.next_1_hours?.summary?.symbol_code ?? '';
    const emoji = symbolToEmoji(symbol);

    return (
      <div className="flex flex-col items-center text-right">
        <span className="text-3xl leading-none">{emoji}</span>
        <span className="text-white font-black text-xl tabular-nums leading-tight mt-0.5">{temp}°</span>
        <span className="text-blue-300 text-[9px] font-bold uppercase tracking-widest mt-0.5">Beitostølen</span>
      </div>
    );
  } catch {
    return null;
  }
}

export function WeatherWidget() {
  return (
    <Suspense fallback={null}>
      <WeatherData />
    </Suspense>
  );
}
