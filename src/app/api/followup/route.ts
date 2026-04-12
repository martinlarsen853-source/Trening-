/**
 * POST /api/followup
 * Ask a follow-up question about a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { askFollowUp } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const { reportContent, question } = await req.json();

    if (!reportContent || !question) {
      return NextResponse.json({ error: 'reportContent and question are required' }, { status: 400 });
    }

    const answer = await askFollowUp(reportContent, question);
    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
