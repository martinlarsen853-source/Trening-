export type ActivityType =
  | 'Run'
  | 'Ride'
  | 'Swim'
  | 'Walk'
  | 'Hike'
  | 'VirtualRide'
  | 'WeightTraining'
  | 'Workout'
  | 'Strength'
  | string;

export type Activity = {
  id: string;
  start_date: string;
  type: ActivityType;
  name: string | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  avg_pace_per_km: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  training_load: number | null;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  calories: number | null;
  avg_cadence: number | null;
  temperature_c: number | null;
  wind_speed_ms: number | null;
  precipitation_mm: number | null;
  weather_symbol: string | null;
  intervals_json: unknown;
  raw_data: unknown;
  synced_at: string;
};

export type Wellness = {
  date: string;
  sleep_seconds: number | null;
  sleep_quality: number | null;
  hrv: number | null;
  resting_hr: number | null;
  weight_kg: number | null;
  stress_level: number | null;
  body_battery_high: number | null;
  body_battery_low: number | null;
  steps: number | null;
  raw_data: unknown;
  synced_at: string;
};

export type StrengthSession = {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  source: 'csv' | 'api';
  imported_at: string;
};

export type StrengthSet = {
  id: string;
  session_id: string;
  exercise_title: string;
  set_index: number | null;
  set_type: string | null;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  superset_id: string | null;
};

export type DailyCheckin = {
  date: string;
  energy: number | null;
  soreness: number | null;
  motivation: number | null;
  stress: number | null;
  sleep_quality: number | null;
  notes: string | null;
  created_at: string;
};

export type InjuryLog = {
  id: string;
  date: string;
  body_part: string;
  pain_level: number | null;
  notes: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  label: string;
  type: string;
  target_value: number | null;
  target_unit: string | null;
  active: boolean;
  created_at: string;
};

export type AiReport = {
  id: string;
  report_type: 'weekly' | 'alert' | 'milestone';
  period_start: string | null;
  period_end: string | null;
  content: string;
  data_snapshot: unknown;
  created_at: string;
};

export type SyncStatus = {
  source: string;
  last_synced_at: string | null;
  last_status: string | null;
  error_message: string | null;
};

export type AppSettings = {
  key: string;
  value: string | null;
  updated_at: string;
};

// Supabase v2 requires Relationships on each table
export type Database = {
  public: {
    Tables: {
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'synced_at'> & { synced_at?: string };
        Update: Partial<Activity>;
        Relationships: [];
      };
      wellness: {
        Row: Wellness;
        Insert: Omit<Wellness, 'synced_at'> & { synced_at?: string };
        Update: Partial<Wellness>;
        Relationships: [];
      };
      strength_sessions: {
        Row: StrengthSession;
        Insert: Omit<StrengthSession, 'id' | 'imported_at'> & { id?: string; imported_at?: string };
        Update: Partial<StrengthSession>;
        Relationships: [];
      };
      strength_sets: {
        Row: StrengthSet;
        Insert: Omit<StrengthSet, 'id'> & { id?: string };
        Update: Partial<StrengthSet>;
        Relationships: [
          {
            foreignKeyName: 'strength_sets_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'strength_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_checkin: {
        Row: DailyCheckin;
        Insert: Omit<DailyCheckin, 'created_at'> & { created_at?: string };
        Update: Partial<DailyCheckin>;
        Relationships: [];
      };
      injury_log: {
        Row: InjuryLog;
        Insert: Omit<InjuryLog, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<InjuryLog>;
        Relationships: [];
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Goal>;
        Relationships: [];
      };
      ai_reports: {
        Row: AiReport;
        Insert: Omit<AiReport, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<AiReport>;
        Relationships: [];
      };
      sync_status: {
        Row: SyncStatus;
        Insert: SyncStatus;
        Update: Partial<SyncStatus>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettings;
        Insert: Omit<AppSettings, 'updated_at'> & { updated_at?: string };
        Update: Partial<AppSettings>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
