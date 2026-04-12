/**
 * POST /api/alerts - Check for alert conditions and generate AI alerts
 * GET  /api/alerts  - List recent alerts
 * Runs every 6 hours via Vercel Cron (vercel.json).
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import { createServiceClient } from '@/lib/supabase/server';
import { generateAlert, type AlertData } from '@/lib/claude';

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('report_type', 'alert')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const triggeredAlerts: string[] = [];

  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');

    // Deduplicate: find alert types already sent today
    const { data: recentAlerts } = await supabase
      .from('ai_reports')
      .select('data_snapshot')
      .eq('report_type', 'alert')
      .gte('created_at', today + 'T00:00:00');

    const alertedTypesToday = new Set(
      (recentAlerts ?? []).map(
        (a) => (a.data_snapshot as Record<string, unknown>)?.alert_type as string
      )
    );

    // --- HRV drop & resting HR & sleep from wellness ---
    const { data: wellness } = await supabase
      .from('wellness')
      .select('date, hrv, resting_hr, sleep_seconds')
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false });

    if (wellness && wellness.length > 0) {
      const latest = wellness[0];

      // HRV drop >15% from 7-day average
      if (!alertedTypesToday.has('hrv_drop') && latest.hrv) {
        const rest = wellness.slice(1).filter((w) => w.hrv);
        if (rest.length >= 3) {
          const avg7d = rest.reduce((s, w) => s + (w.hrv ?? 0), 0) / rest.length;
          if (latest.hrv < avg7d * 0.85) {
            const alertData: AlertData = {
              type: 'hrv_drop',
              current_value: latest.hrv,
              baseline_value: avg7d,
              context: {
                date: latest.date,
                drop_pct: Math.round((1 - latest.hrv / avg7d) * 100),
              },
            };
            const content = await generateAlert(alertData);
            await supabase.from('ai_reports').insert({
              report_type: 'alert',
              period_start: null,
              period_end: null,
              content,
              data_snapshot: { alert_type: 'hrv_drop', ...alertData },
            });
            triggeredAlerts.push('hrv_drop');
          }
        }
      }

      // Resting HR >5 bpm above baseline
      if (!alertedTypesToday.has('high_resting_hr') && latest.resting_hr) {
        const rest = wellness.slice(1).filter((w) => w.resting_hr);
        if (rest.length >= 3) {
          const baseline = rest.reduce((s, w) => s + (w.resting_hr ?? 0), 0) / rest.length;
          if (latest.resting_hr > baseline + 5) {
            const alertData: AlertData = {
              type: 'high_resting_hr',
              current_value: latest.resting_hr,
              baseline_value: baseline,
              context: { date: latest.date },
            };
            const content = await generateAlert(alertData);
            await supabase.from('ai_reports').insert({
              report_type: 'alert',
              period_start: null,
              period_end: null,
              content,
              data_snapshot: { alert_type: 'high_resting_hr', ...alertData },
            });
            triggeredAlerts.push('high_resting_hr');
          }
        }
      }

      // Poor sleep: <5 hours two days in a row
      if (!alertedTypesToday.has('poor_sleep')) {
        const last2 = wellness.slice(0, 2);
        if (
          last2.length === 2 &&
          last2.every((w) => w.sleep_seconds !== null && w.sleep_seconds < 5 * 3600)
        ) {
          const alertData: AlertData = {
            type: 'poor_sleep',
            current_value: Math.round((last2[0].sleep_seconds ?? 0) / 3600),
            context: { dates: last2.map((w) => w.date) },
          };
          const content = await generateAlert(alertData);
          await supabase.from('ai_reports').insert({
            report_type: 'alert',
            period_start: null,
            period_end: null,
            content,
            data_snapshot: { alert_type: 'poor_sleep', ...alertData },
          });
          triggeredAlerts.push('poor_sleep');
        }
      }
    }

    // --- High pain level ≥7 ---
    if (!alertedTypesToday.has('high_pain')) {
      const { data: injuries } = await supabase
        .from('injury_log')
        .select('*')
        .gte('date', twoDaysAgo)
        .gte('pain_level', 7)
        .order('created_at', { ascending: false })
        .limit(1);

      if (injuries && injuries.length > 0) {
        const inj = injuries[0];
        const alertData: AlertData = {
          type: 'high_pain',
          current_value: inj.pain_level ?? 7,
          context: { body_part: inj.body_part, notes: inj.notes },
        };
        const content = await generateAlert(alertData);
        await supabase.from('ai_reports').insert({
          report_type: 'alert',
          period_start: null,
          period_end: null,
          content,
          data_snapshot: { alert_type: 'high_pain', ...alertData },
        });
        triggeredAlerts.push('high_pain');
      }
    }

    // --- Acute:chronic ratio >1.5 ---
    if (!alertedTypesToday.has('high_aclr')) {
      const { data: latestActivity } = await supabase
        .from('activities')
        .select('atl, ctl, start_date')
        .not('atl', 'is', null)
        .not('ctl', 'is', null)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestActivity?.atl && latestActivity?.ctl && latestActivity.ctl > 0) {
        const ratio = latestActivity.atl / latestActivity.ctl;
        if (ratio > 1.5) {
          const alertData: AlertData = {
            type: 'high_aclr',
            current_value: ratio,
            context: { atl: latestActivity.atl, ctl: latestActivity.ctl },
          };
          const content = await generateAlert(alertData);
          await supabase.from('ai_reports').insert({
            report_type: 'alert',
            period_start: null,
            period_end: null,
            content,
            data_snapshot: { alert_type: 'high_aclr', ...alertData },
          });
          triggeredAlerts.push('high_aclr');
        }
      }
    }

    return NextResponse.json({ success: true, alerts_triggered: triggeredAlerts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Alert check error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
