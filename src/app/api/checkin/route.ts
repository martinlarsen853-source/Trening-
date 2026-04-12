/**
 * GET  /api/checkin?date=YYYY-MM-DD - Get check-in for a date
 * POST /api/checkin - Save a check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const limit = parseInt(searchParams.get('limit') || '7');

  if (searchParams.get('history') === 'true') {
    const { data, error } = await supabase
      .from('daily_checkin')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checkins: data });
  }

  const { data, error } = await supabase
    .from('daily_checkin')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkin: data || null });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const date = body.date || format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_checkin')
      .upsert({ ...body, date }, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ checkin: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
