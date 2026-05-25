import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Updated weekly by Martin — send new image to Claude to update
const MEETINGS: { child: string; date: string; time: string; counselor: string }[] = [
  { child: 'Magnus',   date: '2026-05-22', time: '10:00', counselor: 'Rebekka' },
  { child: 'Cecilie',  date: '2026-05-25', time: '13:00', counselor: 'Nicolai' },
  { child: 'Alice',    date: '2026-05-22', time: '09:00', counselor: 'Renate' },
  { child: 'Evelina',  date: '2026-05-22', time: '09:30', counselor: 'Martine' },
  { child: 'Marianna', date: '2026-05-22', time: '09:30', counselor: 'Rebekka' },
  { child: 'Mia',      date: '2026-05-22', time: '09:30', counselor: 'Siri' },
  { child: 'Jacob',    date: '2026-05-22', time: '09:00', counselor: 'Siri' },
  { child: 'Lukas',    date: '2026-05-22', time: '09:30', counselor: 'Renate' },
  { child: 'Lars',     date: '2026-05-25', time: '10:20', counselor: 'Nicolai' },
  { child: 'Johannes', date: '2026-05-22', time: '10:00', counselor: 'Martine' },
  { child: 'Sigurd',   date: '2026-05-22', time: '10:00', counselor: 'Siri' },
];

export async function GET() {
  return NextResponse.json({ meetings: MEETINGS });
}
