/**
 * Intervals.icu API client
 * Docs: https://intervals.icu/api-docs.html
 * Auth: Basic auth with "API_KEY:{api_key}"
 */

const BASE_URL = 'https://intervals.icu/api/v1';

function getAuthHeader(): string {
  const key = process.env.INTERVALS_ICU_API_KEY!;
  return 'Basic ' + Buffer.from(`API_KEY:${key}`).toString('base64');
}

function getAthleteId(): string {
  return process.env.INTERVALS_ICU_ATHLETE_ID || '0';
}

export interface IntervalsActivity {
  id: string;
  start_date_local: string;
  type: string;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  max_speed: number;
  average_heartrate: number;
  max_heartrate: number;
  average_cadence: number;
  calories: number;
  training_load: number;
  ctl: number;
  atl: number;
  form: number;
  start_latlng: number[] | null;
  [key: string]: unknown;
}

export interface IntervalsWellness {
  id: string; // date string YYYY-MM-DD
  sleepSecs: number | null;
  sleepScore: number | null;
  hrv: number | null;
  hrvSDNN: number | null;
  restingHR: number | null;
  weight: number | null;
  score: number | null;
  bodyBattery: number | null;
  bodyBatteryLow: number | null;
  stepsCount: number | null;
  [key: string]: unknown;
}

export async function fetchActivities(
  oldest: string,
  newest: string
): Promise<IntervalsActivity[]> {
  const athleteId = getAthleteId();
  const url = `${BASE_URL}/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Intervals.icu activities fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchWellness(oldest: string, newest: string): Promise<IntervalsWellness[]> {
  const athleteId = getAthleteId();
  const url = `${BASE_URL}/athlete/${athleteId}/wellness?oldest=${oldest}&newest=${newest}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Intervals.icu wellness fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchActivityDetail(activityId: string): Promise<IntervalsActivity> {
  const url = `${BASE_URL}/activity/${activityId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Intervals.icu activity detail fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/** Convert intervals activity to DB row */
export function mapActivityToRow(activity: IntervalsActivity) {
  // avg_pace_per_km: convert m/s to seconds/km
  const avgPace =
    activity.average_speed && activity.average_speed > 0
      ? 1000 / activity.average_speed
      : null;

  return {
    id: String(activity.id),
    start_date: activity.start_date_local,
    type: activity.type || 'Unknown',
    name: activity.name || null,
    distance_meters: activity.distance || null,
    duration_seconds: activity.moving_time || activity.elapsed_time || null,
    avg_pace_per_km: avgPace,
    avg_hr: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    max_hr: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
    training_load: activity.training_load || null,
    ctl: activity.ctl || null,
    atl: activity.atl || null,
    tsb: activity.form || null,
    calories: activity.calories ? Math.round(activity.calories) : null,
    avg_cadence: activity.average_cadence || null,
    temperature_c: null,
    wind_speed_ms: null,
    precipitation_mm: null,
    weather_symbol: null,
    intervals_json: null,
    raw_data: activity,
  };
}

/** Convert wellness to DB row */
export function mapWellnessToRow(w: IntervalsWellness) {
  return {
    date: w.id,
    sleep_seconds: w.sleepSecs || null,
    sleep_quality: w.sleepScore || null,
    hrv: w.hrv || null,
    resting_hr: w.restingHR || null,
    weight_kg: w.weight || null,
    stress_level: w.score || null,
    body_battery_high: w.bodyBattery || null,
    body_battery_low: w.bodyBatteryLow || null,
    steps: w.stepsCount || null,
    raw_data: w,
  };
}
