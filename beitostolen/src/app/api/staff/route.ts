import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

// Allow up to 2 MB body (resized photos are ~50–200 KB as base64)
export const maxDuration = 30;

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// GET — list all staff
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('sort_order')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// POST — create or update staff (with optional base64 photo)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, title, photoBase64, photoExt, existingPhotoUrl } = body as {
      id: string;
      name: string;
      title: string | null;
      photoBase64?: string;
      photoExt?: string;
      existingPhotoUrl?: string;
    };

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'Mangler id eller navn' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Upload photo if provided as base64
    let photo_url: string | null = existingPhotoUrl ?? null;
    if (photoBase64 && photoExt) {
      const buffer = Buffer.from(photoBase64, 'base64');
      const path = `${id}.${photoExt}`;
      const { error: uploadError } = await supabase.storage
        .from('staff-photos')
        .upload(path, buffer, {
          contentType: photoExt === 'png' ? 'image/png' : 'image/jpeg',
          upsert: true,
        });
      if (!uploadError) {
        photo_url = supabase.storage.from('staff-photos').getPublicUrl(path).data.publicUrl;
      }
    }

    const payload = { id, name: name.trim(), title: title?.trim() || null, photo_url };

    // Upsert (insert or update based on id)
    const { data, error } = await supabase
      .from('staff')
      .upsert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ staff: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ukjent serverfeil';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove a staff member
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Mangler id' }, { status: 400 });
  const supabase = getSupabase();
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
