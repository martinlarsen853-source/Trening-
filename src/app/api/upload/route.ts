/**
 * POST /api/upload
 * Upload and parse Hevy CSV workout data
 */

import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createServiceClient } from '@/lib/supabase/server';
import { parseHevyCSV, type HevyCSVRow } from '@/lib/hevy';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();

    const parsed = Papa.parse<HevyCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/ /g, '_'),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'CSV parse error', details: parsed.errors }, { status: 400 });
    }

    const sessions = parseHevyCSV(parsed.data);

    let sessionsInserted = 0;
    let setsInserted = 0;

    for (const session of sessions) {
      const { data: existing } = await supabase
        .from('strength_sessions')
        .select('id')
        .eq('title', session.title)
        .eq('start_time', session.start_time)
        .maybeSingle();

      let sessionId: string;

      if (existing) {
        sessionId = existing.id;
        await supabase.from('strength_sets').delete().eq('session_id', sessionId);
      } else {
        const { data: newSession, error } = await supabase
          .from('strength_sessions')
          .insert({
            title: session.title,
            start_time: session.start_time,
            end_time: session.end_time,
            description: session.description,
            source: 'csv',
          })
          .select('id')
          .single();

        if (error || !newSession) {
          console.error('Session insert error:', error);
          continue;
        }

        sessionId = newSession.id;
        sessionsInserted++;
      }

      if (session.sets.length > 0) {
        const { error: setsError } = await supabase
          .from('strength_sets')
          .insert(session.sets.map((s) => ({ ...s, session_id: sessionId })));

        if (!setsError) setsInserted += session.sets.length;
        else console.error('Sets insert error:', setsError);
      }
    }

    return NextResponse.json({
      success: true,
      sessions_imported: sessionsInserted,
      sets_imported: setsInserted,
      total_sessions_in_file: sessions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
