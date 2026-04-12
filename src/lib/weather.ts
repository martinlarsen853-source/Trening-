/**
 * MET Norway / yr.no weather API
 * Docs: https://api.met.no/weatherapi/locationforecast/2.0/
 * No API key required. User-Agent header required.
 * Creative Commons license.
 */

const MET_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const USER_AGENT = process.env.WEATHER_USER_AGENT || 'TrainingDashboard/1.0 martin@example.com';

interface TimeseriesEntry {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        wind_speed?: number;
        relative_humidity?: number;
      };
    };
    next_1_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
    next_6_hours?: {
      summary?: { symbol_code?: string };
      details?: { precipitation_amount?: number };
    };
  };
}

export interface WeatherData {
  temperature_c: number | null;
  wind_speed_ms: number | null;
  precipitation_mm: number | null;
  weather_symbol: string | null;
}

// Simple in-memory cache to respect API rate limits
const weatherCache = new Map<string, { data: TimeseriesEntry[]; expires: number }>();

export async function fetchWeatherForTime(
  lat: number,
  lon: number,
  targetTime: Date
): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const now = Date.now();

  let timeseries: TimeseriesEntry[];

  if (weatherCache.has(cacheKey) && weatherCache.get(cacheKey)!.expires > now) {
    timeseries = weatherCache.get(cacheKey)!.data;
  } else {
    const url = `${MET_BASE}?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!res.ok) {
      console.warn(`Weather fetch failed: ${res.status}`);
      return { temperature_c: null, wind_speed_ms: null, precipitation_mm: null, weather_symbol: null };
    }

    const data = await res.json();
    timeseries = data.properties?.timeseries || [];

    // Cache for 30 minutes
    weatherCache.set(cacheKey, { data: timeseries, expires: now + 30 * 60 * 1000 });
  }

  // Find closest time entry
  const targetMs = targetTime.getTime();
  let closest: TimeseriesEntry | null = null;
  let minDiff = Infinity;

  for (const entry of timeseries) {
    const diff = Math.abs(new Date(entry.time).getTime() - targetMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  if (!closest) {
    return { temperature_c: null, wind_speed_ms: null, precipitation_mm: null, weather_symbol: null };
  }

  const instant = closest.data.instant.details;
  const next = closest.data.next_1_hours || closest.data.next_6_hours;

  return {
    temperature_c: instant.air_temperature ?? null,
    wind_speed_ms: instant.wind_speed ?? null,
    precipitation_mm: next?.details?.precipitation_amount ?? null,
    weather_symbol: next?.summary?.symbol_code ?? null,
  };
}
