/**
 * Hevy workout parser
 * Phase 1: CSV import
 * Phase 2: API (when HEVY_API_ENABLED=true)
 */

export interface HevyCSVRow {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  exercise_title: string;
  superset_id: string;
  exercise_notes: string;
  set_index: string;
  set_type: string;
  weight_lbs: string;
  reps: string;
  distance_miles: string;
  duration_seconds: string;
  rpe: string;
}

export interface ParsedSession {
  title: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  sets: ParsedSet[];
}

export interface ParsedSet {
  exercise_title: string;
  set_index: number | null;
  set_type: string | null;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  superset_id: string | null;
}

const LBS_TO_KG = 0.453592;

function parseNumber(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export function parseHevyCSV(rows: HevyCSVRow[]): ParsedSession[] {
  const sessions = new Map<string, ParsedSession>();

  for (const row of rows) {
    const key = `${row.title}__${row.start_time}`;

    if (!sessions.has(key)) {
      sessions.set(key, {
        title: row.title,
        start_time: row.start_time,
        end_time: row.end_time || null,
        description: row.description || null,
        sets: [],
      });
    }

    const session = sessions.get(key)!;

    const weightLbs = parseNumber(row.weight_lbs);
    const weightKg = weightLbs !== null ? Math.round(weightLbs * LBS_TO_KG * 100) / 100 : null;

    session.sets.push({
      exercise_title: row.exercise_title,
      set_index: parseNumber(row.set_index),
      set_type: row.set_type || null,
      weight_kg: weightKg,
      reps: parseNumber(row.reps),
      duration_seconds: parseNumber(row.duration_seconds),
      rpe: parseNumber(row.rpe),
      superset_id: row.superset_id || null,
    });
  }

  return Array.from(sessions.values());
}

// Phase 2: Hevy API client
const HEVY_API_BASE = 'https://api.hevyapp.com';

export async function fetchHevyWorkouts(page = 1, pageSize = 20): Promise<unknown[]> {
  if (process.env.HEVY_API_ENABLED !== 'true') {
    throw new Error('Hevy API is not enabled. Set HEVY_API_ENABLED=true');
  }

  const res = await fetch(`${HEVY_API_BASE}/v1/workouts?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'api-key': process.env.HEVY_API_KEY!,
    },
  });

  if (!res.ok) {
    throw new Error(`Hevy API fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.workouts || [];
}
