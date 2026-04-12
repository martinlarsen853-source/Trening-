import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('sync_status')
    .select('*')
    .eq('source', 'intervals_icu')
    .maybeSingle();

  return NextResponse.json({ status: data });
}
