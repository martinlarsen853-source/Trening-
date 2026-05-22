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

async function ForecastData() {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timeseries: any[] = data.properties.timeseries.slice(0, 9);

    return (
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {timeseries.map((entry, i) => {
            const temp = Math.round(entry.data.instant.details.air_temperature);
            const symbol: string = entry.data.next_1_hours?.summary?.symbol_code ?? '';
            const emoji = symbolToEmoji(symbol);
            const date = new Date(entry.time);
            const time = date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' });

            return (
              <div
                key={time}
                className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-3 py-2.5 min-w-[56px] transition-all ${
                  i === 0
                    ? 'bg-blue-600 shadow-md shadow-blue-500/25'
                    : 'bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wide ${i === 0 ? 'text-blue-200' : 'text-gray-400'}`}>
                  {i === 0 ? 'Nå' : time}
                </span>
                <span className="text-xl leading-snug mt-0.5">{emoji}</span>
                <span className={`text-sm font-black tabular-nums leading-tight ${i === 0 ? 'text-white' : 'text-gray-800'}`}>
                  {temp}°
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export function WeatherForecast() {
  return (
    <Suspense fallback={null}>
      <ForecastData />
    </Suspense>
  );
}
