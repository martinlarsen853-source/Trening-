import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
  return NextResponse.json({ settings: map });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  try {
    const body: Record<string, string> = await req.json();
    const rows = Object.entries(body).map(([key, value]) => ({ key, value }));

    const { error } = await supabase
      .from('app_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
