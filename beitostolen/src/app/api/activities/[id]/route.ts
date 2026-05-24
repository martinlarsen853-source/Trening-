import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET — fetch current staff assignments for an activity
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('activity_staff')
    .select('staff_id')
    .eq('activity_id', id);
  return NextResponse.json({ staffIds: (data ?? []).map(r => r.staff_id) });
}

// PATCH — update load_level and/or staff assignments for an activity
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { load_level?: string | null; staffIds?: string[] };
  const supabase = getSupabase();

  if ('load_level' in body) {
    const { error } = await supabase
      .from('activities')
      .update({ load_level: body.load_level ?? null })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.staffIds !== undefined) {
    await supabase.from('activity_staff').delete().eq('activity_id', id);
    if (body.staffIds.length > 0) {
      const { error } = await supabase.from('activity_staff').insert(
        body.staffIds.map(staff_id => ({ activity_id: id, staff_id }))
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
