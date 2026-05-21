import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToAll } from '@/lib/push';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { activity_id, child_name } = await req.json();
  if (!activity_id || !child_name) {
    return NextResponse.json({ error: 'Mangler felt' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: activity } = await supabase
    .from('activities')
    .select('name, time_start, day_of_week')
    .eq('id', activity_id)
    .single();

  const { data: absence, error } = await supabase
    .from('absences')
    .insert({ activity_id, child_name })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (activity) {
    const time = activity.time_start.slice(0, 5);
    await sendPushToAll(
      'Avbud',
      `${child_name} kommer ikke til ${activity.name} kl ${time}`,
      '/'
    );
  }

  return NextResponse.json({ absence });
}
