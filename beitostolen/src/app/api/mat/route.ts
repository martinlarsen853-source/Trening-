import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

const ADMIN_PIN = process.env.MENU_ADMIN_PIN || 'bhs2026';

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const supabase = getSupabase();
  let query = supabase.from('daily_menu').select('*').order('date').order('serve_time');
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meals: data });
}

export async function POST(req: NextRequest) {
  const { pin, date, meal_name, serve_time, notes } = await req.json();
  if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Feil PIN' }, { status: 403 });
  if (!date || !meal_name || !serve_time) {
    return NextResponse.json({ error: 'Mangler felt' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('daily_menu')
    .insert({ date, meal_name, serve_time, notes: notes || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meal: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const pin = searchParams.get('pin');

  if (pin !== ADMIN_PIN) return NextResponse.json({ error: 'Feil PIN' }, { status: 403 });
  if (!id) return NextResponse.json({ error: 'Mangler id' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from('daily_menu').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
