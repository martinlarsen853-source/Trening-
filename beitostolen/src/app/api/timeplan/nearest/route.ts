import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // Finn nærmeste fremtidige uke med aktiviteter (eller siste fortid)
  const { data: future } = await supabase
    .from('activities')
    .select('week_start')
    .gte('week_start', today)
    .order('week_start', { ascending: true })
    .limit(1)
    .single();

  if (future) return NextResponse.json({ weekStart: future.week_start });

  const { data: past } = await supabase
    .from('activities')
    .select('week_start')
    .lt('week_start', today)
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (past) return NextResponse.json({ weekStart: past.week_start });

  return NextResponse.json({ weekStart: null });
}
