import { NextResponse } from 'next/server';

export const revalidate = 1800;

export async function GET() {
  try {
    const res = await fetch(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=61.3002&lon=8.9303',
      {
        headers: { 'User-Agent': 'beitostolen-2c-app/1.0 github.com/martinlarsen853-source/Trening-' },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return NextResponse.json({ timeseries: [] });
    const data = await res.json();
    // Return enough hours for the client to always find current + next 8
    const timeseries = data.properties.timeseries.slice(0, 24).map((e: { time: string; data: { instant: { details: { air_temperature: number } }; next_1_hours?: { summary?: { symbol_code?: string } } } }) => ({
      time: e.time,
      temp: Math.round(e.data.instant.details.air_temperature),
      symbol: e.data.next_1_hours?.summary?.symbol_code ?? '',
    }));
    return NextResponse.json({ timeseries });
  } catch {
    return NextResponse.json({ timeseries: [] });
  }
}
