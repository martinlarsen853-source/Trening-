-- Intervals.icu activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  start_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  name TEXT,
  distance_meters REAL,
  duration_seconds INTEGER,
  avg_pace_per_km REAL,
  avg_hr INTEGER,
  max_hr INTEGER,
  training_load REAL,
  ctl REAL,
  atl REAL,
  tsb REAL,
  calories INTEGER,
  avg_cadence REAL,
  temperature_c REAL,
  wind_speed_ms REAL,
  precipitation_mm REAL,
  weather_symbol TEXT,
  intervals_json JSONB,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness from Intervals.icu (daily)
CREATE TABLE IF NOT EXISTS wellness (
  date DATE PRIMARY KEY,
  sleep_seconds INTEGER,
  sleep_quality REAL,
  hrv REAL,
  resting_hr INTEGER,
  weight_kg REAL,
  stress_level INTEGER,
  body_battery_high INTEGER,
  body_battery_low INTEGER,
  steps INTEGER,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strength training from Hevy
CREATE TABLE IF NOT EXISTS strength_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  description TEXT,
  source TEXT DEFAULT 'csv',
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strength_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES strength_sessions(id) ON DELETE CASCADE,
  exercise_title TEXT NOT NULL,
  set_index INTEGER,
  set_type TEXT,
  weight_kg REAL,
  reps INTEGER,
  duration_seconds INTEGER,
  rpe REAL,
  superset_id TEXT
);

-- Subjective wellness (daily check-in)
CREATE TABLE IF NOT EXISTS daily_checkin (
  date DATE PRIMARY KEY,
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  soreness INTEGER CHECK (soreness BETWEEN 1 AND 5),
  motivation INTEGER CHECK (motivation BETWEEN 1 AND 5),
  stress INTEGER CHECK (stress BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injury log
CREATE TABLE IF NOT EXISTS injury_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  body_part TEXT NOT NULL,
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  target_value REAL,
  target_unit TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI analysis log
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  content TEXT NOT NULL,
  data_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync status
CREATE TABLE IF NOT EXISTS sync_status (
  source TEXT PRIMARY KEY,
  last_synced_at TIMESTAMPTZ,
  last_status TEXT,
  error_message TEXT
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_wellness_date ON wellness(date DESC);
CREATE INDEX IF NOT EXISTS idx_strength_sessions_start_time ON strength_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkin_date ON daily_checkin(date DESC);
CREATE INDEX IF NOT EXISTS idx_injury_log_date ON injury_log(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);

-- RLS: single user, enable but allow all for service role
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single user app)
CREATE POLICY "Allow all for authenticated" ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON wellness FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON strength_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON strength_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON daily_checkin FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON injury_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON ai_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON sync_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default goals for Martin
INSERT INTO goals (label, type, target_value, target_unit, active)
VALUES
  ('Sub-21:00 5K', 'primary', 1260, 'seconds', true),
  ('Hyrox sub-70 min', 'secondary', 4200, 'seconds', true),
  ('60 km ukentlig løpevolum', 'weekly_volume', 60, 'km_per_week', true),
  ('3 styrkeøkter per uke', 'strength_frequency', 3, 'sessions_per_week', true)
ON CONFLICT DO NOTHING;

-- Insert default app settings
INSERT INTO app_settings (key, value)
VALUES
  ('default_lat', '63.43'),
  ('default_lon', '10.40'),
  ('intervals_icu_athlete_id', '0')
ON CONFLICT DO NOTHING;
