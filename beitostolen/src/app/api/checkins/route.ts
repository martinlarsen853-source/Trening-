import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToAll } from '@/lib/push';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function GET() {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('room_checkins')
    .select('*')
    .gt('expires_at', now)
    .order('checked_in_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checkins: data });
}

export async function POST(req: NextRequest) {
  const { room_name, parent_name, duration_minutes } = await req.json();
  if (!room_name || !parent_name || typeof duration_minutes !== 'number' || duration_minutes % 30 !== 0 || duration_minutes < 30 || duration_minutes > 240) {
    return NextResponse.json({ error: 'Mangler felt' }, { status: 400 });
  }

  const supabase = getSupabase();
  const now = new Date();
  const expires_at = new Date(now.getTime() + duration_minutes * 60000).toISOString();

  // Remove any existing checkin for this person in this room
  await supabase
    .from('room_checkins')
    .delete()
    .eq('room_name', room_name)
    .eq('parent_name', parent_name);

  const { data: checkin, error } = await supabase
    .from('room_checkins')
    .insert({ room_name, parent_name, duration_minutes, expires_at })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const h = duration_minutes / 60;
  const durationLabel = duration_minutes < 60 ? `${duration_minutes} min` : h === Math.floor(h) ? `${h} time${h !== 1 ? 'r' : ''}` : `${h} timer`;
  await sendPushToAll(
    room_name,
    `${parent_name} er i ${room_name} – ca. ${durationLabel}`,
    '/fellesrom'
  );

  return NextResponse.json({ checkin });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Mangler id' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from('room_checkins').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
