import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('login_log')
      .select('id, code_used, entity_type, device_type, logged_at')
      .order('logged_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ entries: data ?? [] });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}
