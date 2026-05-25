import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://irrugkoifthqtnzkvvur.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycnVna29pZnRocXRuemt2dnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjQxNjcsImV4cCI6MjA5NDk0MDE2N30.e7suy0AGb5ujELBYgxwB6sx5OzyXBdUKIg12dYpZX3Y';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BOMLIcvnLWpJmvy7E61M39g0BnhIgQME_2_lJdjC8j3-vxpkF1HSvJstCW8yfHqxUPMm8Dbobn35IJfm1v5vgNI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

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
  group_name: 'blå' | 'gul' | null;
  target_child: string | null;
  is_adult_meeting: boolean;
  load_level: 'lav' | 'middels' | 'høy' | null;
  staff_name: string | null;
  staff_id: string | null;
  transition_flags: string[];
  transition_note: string | null;
};

export type ChildProfile = {
  id: string;
  child_name: string;
  adaptations: string[];
  note: string | null;
  updated_at: string;
};

export type StaffMember = {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  sort_order: number;
};

export type ActivityStatus = {
  id: string;
  activity_id: string;
  date: string;
  status: 'pågår' | 'forsinket' | 'avlyst' | 'flyttet';
  note: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type DailyCheckin = {
  id: string;
  child_name: string;
  date: string;
  form_level: 'grønn' | 'gul' | 'rød';
  registered_at: string;
};

export type Attendance = {
  id: string;
  activity_id: string;
  date: string;
  child_name: string;
  present: boolean;
  marked_at: string;
  marked_by: string | null;
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

export type TimeplanActivity = {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
  time_start: string;
  time_end: string;
  day_of_week: number;
  group_name: 'blå' | 'gul' | null;
  target_child: string | null;
  is_adult_meeting: boolean;
  load_level: 'lav' | 'middels' | 'høy' | null;
  staff_name: string | null;
  staff_id: string | null;
  staff: { id: string; name: string; photo_url: string | null }[];
  myAbsence: boolean;
  relevantAbsences: string[];
  transition_flags: string[];
  transition_note: string | null;
};

export type TimeplanDay = {
  dayOfWeek: number;
  main: TimeplanActivity[];
  fritid: TimeplanActivity[];
};
