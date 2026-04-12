/**
 * POST /api/reports - Generate a new weekly AI report
 * GET  /api/reports - List all reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { createServiceClient } from '@/lib/supabase/server';
import { generateWeeklyReport, type WeeklyReportData } from '@/lib/claude';

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ai_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await req.json().catch(() => ({}));

    const now = new Date();
    const periodEnd = body.period_end
      ? new Date(body.period_end)
      : endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const periodStart = body.period_start
      ? new Date(body.period_start)
      : startOfWeek(subDays(now, 7), { weekStartsOn: 1 });

    const startStr = format(periodStart, 'yyyy-MM-dd');
    const endStr = format(periodEnd, 'yyyy-MM-dd');

    const [
      { data: activities },
      { data: wellness },
      { data: strengthSessions },
      { data: checkins },
      { data: injuries },
      { data: goals },
      { data: previousReports },
    ] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .gte('start_date', startStr)
        .lte('start_date', endStr + 'T23:59:59')
        .order('start_date'),
      supabase
        .from('wellness')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date'),
      supabase
        .from('strength_sessions')
        .select('*, strength_sets(*)')
        .gte('start_time', startStr)
        .lte('start_time', endStr + 'T23:59:59')
        .order('start_time'),
      supabase
        .from('daily_checkin')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date'),
      supabase
        .from('injury_log')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date'),
      supabase.from('goals').select('*').eq('active', true),
      supabase
        .from('ai_reports')
        .select('content')
        .eq('report_type', 'weekly')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const goalsText = (goals || []).map((g) => `- ${g.label}`).join('\n');
    const previousSummary = previousReports?.[0]?.content?.slice(0, 500) ?? '';

    const reportData: WeeklyReportData = {
      period: `${startStr} til ${endStr}`,
      activities: activities ?? [],
      wellness_daily: wellness ?? [],
      strength_sessions: strengthSessions ?? [],
      daily_checkins: checkins ?? [],
      injury_log: injuries ?? [],
      goals: goals ?? [],
      previous_week_summary: previousSummary,
    };

    const content = await generateWeeklyReport(reportData, goalsText);

    const { data: saved, error: saveError } = await supabase
      .from('ai_reports')
      .insert({
        report_type: 'weekly',
        period_start: startStr,
        period_end: endStr,
        content,
        data_snapshot: {
          activities_count: activities?.length ?? 0,
          wellness_count: wellness?.length ?? 0,
        },
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ report: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Report generation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
