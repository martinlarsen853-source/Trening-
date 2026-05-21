import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { name, subscription } = await req.json();
  if (!name || !subscription) {
    return NextResponse.json({ error: 'Mangler felt' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Upsert: replace existing subscription for this endpoint
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('subscription->>endpoint', subscription.endpoint);

  const { error } = await supabase
    .from('push_subscriptions')
    .insert({ name, subscription });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
