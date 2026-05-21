import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);

export type Activity = {
  id: string;
  week_start: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  name: string;
  location: string | null;
  notes: string | null;
  is_fritid: boolean;
};

export type Absence = {
  id: string;
  activity_id: string;
  child_name: string;
  registered_at: string;
};

export type RoomCheckin = {
  id: string;
  room_name: string;
  parent_name: string;
  checked_in_at: string;
  duration_minutes: 30 | 60 | 120;
  expires_at: string;
};

export type PushSubscription = {
  id: string;
  name: string;
  subscription: PushSubscriptionJSON;
};
