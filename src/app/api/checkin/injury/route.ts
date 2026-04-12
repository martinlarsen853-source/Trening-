/**
 * POST /api/checkin/injury - Log an injury
 * GET  /api/checkin/injury - List recent injuries
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const { data, error } = await supabase
    .from('injury_log')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ injuries: data });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const date = body.date || format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('injury_log')
      .insert({ ...body, date })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ injury: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
