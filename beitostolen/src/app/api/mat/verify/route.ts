import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PIN = process.env.MENU_ADMIN_PIN || 'bhs2026';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Feil PIN' }, { status: 403 });
  return NextResponse.json({ ok: true });
}
