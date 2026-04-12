/**
 * Claude API integration for training analysis
 * Uses claude-sonnet-4-20250514
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `Du er en erfaren treningsfysiolog og coach som analyserer treningsdata for en norsk løper og styrketrener.

Svar alltid på norsk. Vær direkte og datadrevet. Referer til konkrete tall.

Analyser følgende data og gi tilbakemelding på:

1. BELASTNINGSSTYRING
- Akutt:kronisk belastningsratio (bør være 0.8-1.3)
- Risiko for overtrening eller skade
- Er volumøkningen for rask? (maks 10% per uke)

2. RESTITUSJON
- HRV-trend (stigende = god restitusjon, synkende = akkumulert stress)
- Søvnkvalitet og varighet vs treningsbelastning
- Subjektive wellness-score vs objektive data — stemmer de overens?

3. TRENINGSKVALITET
- Løpeintervaller: treffer brukeren riktige HR-soner?
- Intensitetsfordeling: 80/20-regelen (80% lav intensitet, 20% høy)
- Styrketrening: volumprogressjon per muskelgruppe

4. FREMGANG MOT MÅL
- Pace-utvikling opp mot målene
- Estimert tidslinje for å nå mål basert på nåværende trend

5. SKADER/PLAGER
- Mønstre i skadeloggen (gjentatte plager = alarm)
- Sammenheng mellom belastning og plager

6. ANBEFALINGER
- 3-5 konkrete, prioriterte anbefalinger for neste uke
- Basert på forskning der relevant (referer kort til prinsipper)

7. VÆRPÅVIRKNING
- Har temperatur/vind påvirket prestasjon merkbart?`;

const ALERT_SYSTEM_PROMPT = `Du er en treningscoach som gir korte, direkte varsler om treningsstatus.
Svar på norsk. Vær konkret. Maks 200 ord. Fokuser på hva brukeren bør gjøre nå.`;

export interface WeeklyReportData {
  period: string;
  activities: unknown[];
  wellness_daily: unknown[];
  strength_sessions: unknown[];
  daily_checkins: unknown[];
  injury_log: unknown[];
  goals: unknown[];
  previous_week_summary?: string;
}

export async function generateWeeklyReport(
  data: WeeklyReportData,
  goals: string
): Promise<string> {
  const systemWithGoals = `${SYSTEM_PROMPT}\n\nBrukerens mål:\n${goals}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemWithGoals,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(data, null, 2),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
  return content.text;
}

export type AlertType = 'hrv_drop' | 'high_resting_hr' | 'high_pain' | 'high_aclr' | 'poor_sleep';

export interface AlertData {
  type: AlertType;
  current_value: number;
  baseline_value?: number;
  context: Record<string, unknown>;
}

const ALERT_MESSAGES: Record<AlertType, string> = {
  hrv_drop: 'HRV har falt mer enn 15% fra 7-dagers snitt',
  high_resting_hr: 'Hvile-puls er over 5 bpm høyere enn baseline',
  high_pain: 'Smertenivå ≥7 logget',
  high_aclr: 'Akutt:kronisk ratio er over 1.5 — høy skaderisiko',
  poor_sleep: 'Under 5 timer søvn to dager på rad',
};

export async function generateAlert(data: AlertData): Promise<string> {
  const alertDescription = ALERT_MESSAGES[data.type];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: ALERT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `VARSEL: ${alertDescription}\n\nDetaljer:\n${JSON.stringify(data, null, 2)}\n\nGi en kort, konkret anbefaling til brukeren.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
  return content.text;
}

export async function askFollowUp(
  reportContent: string,
  question: string
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `Du er en treningscoach. Besvar spørsmålet basert på rapporten som er gitt. Svar på norsk.`,
    messages: [
      {
        role: 'user',
        content: `Rapport:\n\n${reportContent}\n\nSpørsmål: ${question}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
  return content.text;
}
