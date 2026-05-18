-- SQL Schema + Safe Migration for Abdulloh AI
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Base tables (safe create)
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  bp INTEGER NOT NULL,
  cholesterol INTEGER NOT NULL,
  smoking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2) Incremental migration for frontend CaseData compatibility
ALTER TABLE cases ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS living_conditions TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS air_quality TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ecological_cleanliness TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS dbp NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS hemoglobin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS wbc NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS platelets NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS glucose NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS creatinine NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS creatinine_unit TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ldl NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS hdl NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS triglycerides NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS crp NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS troponin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS alt NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ast NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sodium NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS potassium NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS chloride NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS bicarbonate NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS albumin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS calcium NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS bilirubin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS inr NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS bun NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mcv NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mch NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS mchc NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ferritin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS iron NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tibc NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS vitamin_b12 NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS folate NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS reticulocytes NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ldh NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS haptoglobin NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS measured_osmolality NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS urine_na NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS urine_creatinine NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ascites TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS encephalopathy TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS rr NUMERIC;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS gcs_less_15 BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS chf BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS hypertension BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS stroke_history BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS vascular_disease BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS diabetes_history BOOLEAN DEFAULT false;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS lab_text TEXT;

ALTER TABLE uploads ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 3) Performance indexes
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_case_id ON uploads(case_id);
CREATE INDEX IF NOT EXISTS idx_chats_case_id ON chats(case_id);

-- 4) Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 5) Recreate policies safely
DROP POLICY IF EXISTS "Users can select their own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON cases;

CREATE POLICY "Users can select their own cases" ON cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases" ON cases
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases" ON cases
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select uploads for owned cases" ON uploads;
DROP POLICY IF EXISTS "Users can insert uploads for owned cases" ON uploads;
DROP POLICY IF EXISTS "Users can update uploads for owned cases" ON uploads;
DROP POLICY IF EXISTS "Users can delete uploads for owned cases" ON uploads;

CREATE POLICY "Users can select uploads for owned cases" ON uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert uploads for owned cases" ON uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update uploads for owned cases" ON uploads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete uploads for owned cases" ON uploads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can select chats for owned cases" ON chats;
DROP POLICY IF EXISTS "Users can insert chats for owned cases" ON chats;
DROP POLICY IF EXISTS "Users can update chats for owned cases" ON chats;
DROP POLICY IF EXISTS "Users can delete chats for owned cases" ON chats;

CREATE POLICY "Users can select chats for owned cases" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chats for owned cases" ON chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chats for owned cases" ON chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chats for owned cases" ON chats
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

-- 6) Storage bucket expectation
-- Bucket must be named: medical-uploads
-- Suggested storage policy condition:
-- (auth.uid()::text = (storage.foldername(name))[1])

-- Silent Disease Hunter natijalari: mavjud jadval va eski ma'lumotlarga tegmaydigan alohida saqlash qatlami.
CREATE TABLE IF NOT EXISTS public.silent_disease_hunter_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  overall_risk integer NOT NULL DEFAULT 0,
  physiological_stability integer NOT NULL DEFAULT 0,
  confidence integer NOT NULL DEFAULT 0,
  signal_quality integer NOT NULL DEFAULT 0,
  emergency_warning boolean NOT NULL DEFAULT false,
  used_inputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  organ_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  differential_reasoning jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text NOT NULL DEFAULT '',
  ai_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  patient_explanation text NOT NULL DEFAULT '',
  doctor_note text NOT NULL DEFAULT '',
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.silent_disease_hunter_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sdh_results_patient_id ON public.silent_disease_hunter_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_sdh_results_created_at ON public.silent_disease_hunter_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sdh_results_user_id ON public.silent_disease_hunter_results(user_id);

DROP POLICY IF EXISTS "silent disease hunter select own" ON public.silent_disease_hunter_results;
CREATE POLICY "silent disease hunter select own"
ON public.silent_disease_hunter_results
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "silent disease hunter insert own" ON public.silent_disease_hunter_results;
CREATE POLICY "silent disease hunter insert own"
ON public.silent_disease_hunter_results
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "silent disease hunter update own" ON public.silent_disease_hunter_results;
CREATE POLICY "silent disease hunter update own"
ON public.silent_disease_hunter_results
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Aqlli reabilitatsiya mashqlari: mavjud jadvallarga tegmaydigan alohida modul jadvallari.
CREATE TABLE IF NOT EXISTS public.rehabilitation_sessions (
  id text PRIMARY KEY,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NOT NULL DEFAULT now(),
  total_score integer NOT NULL DEFAULT 0,
  accuracy_percent integer NOT NULL DEFAULT 0,
  fatigue_index integer NOT NULL DEFAULT 0,
  symmetry_index integer NOT NULL DEFAULT 0,
  movement_quality_score integer NOT NULL DEFAULT 0,
  clinical_summary text NOT NULL DEFAULT '',
  patient_advice text NOT NULL DEFAULT '',
  doctor_note text NOT NULL DEFAULT '',
  raw_session jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehabilitation_exercises (
  id text PRIMARY KEY,
  session_id text REFERENCES public.rehabilitation_sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  exercise_type text NOT NULL,
  target_body_part text NOT NULL,
  repetitions_done integer NOT NULL DEFAULT 0,
  repetitions_correct integer NOT NULL DEFAULT 0,
  repetitions_wrong integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  accuracy_percent integer NOT NULL DEFAULT 0,
  range_of_motion integer NOT NULL DEFAULT 0,
  average_speed integer NOT NULL DEFAULT 0,
  tremor_score integer NOT NULL DEFAULT 0,
  error_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehabilitation_joint_metrics (
  id text PRIMARY KEY,
  exercise_id text REFERENCES public.rehabilitation_exercises(id) ON DELETE CASCADE,
  joint_name text NOT NULL,
  min_angle integer NOT NULL DEFAULT 0,
  max_angle integer NOT NULL DEFAULT 0,
  average_angle integer NOT NULL DEFAULT 0,
  ideal_angle integer NOT NULL DEFAULT 0,
  deviation integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehabilitation_plans (
  id text PRIMARY KEY,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  frequency text NOT NULL DEFAULT '',
  duration_days integer NOT NULL DEFAULT 0,
  precautions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rehabilitation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehabilitation_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehabilitation_joint_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehabilitation_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rehab_sessions_patient_id ON public.rehabilitation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_sessions_created_at ON public.rehabilitation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rehab_exercises_session_id ON public.rehabilitation_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_rehab_joint_metrics_exercise_id ON public.rehabilitation_joint_metrics(exercise_id);
CREATE INDEX IF NOT EXISTS idx_rehab_plans_patient_id ON public.rehabilitation_plans(patient_id);

DROP POLICY IF EXISTS "rehab sessions select own" ON public.rehabilitation_sessions;
CREATE POLICY "rehab sessions select own" ON public.rehabilitation_sessions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() = doctor_id);
DROP POLICY IF EXISTS "rehab sessions insert own" ON public.rehabilitation_sessions;
CREATE POLICY "rehab sessions insert own" ON public.rehabilitation_sessions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.uid() = doctor_id);
DROP POLICY IF EXISTS "rehab sessions update own" ON public.rehabilitation_sessions;
CREATE POLICY "rehab sessions update own" ON public.rehabilitation_sessions FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() = doctor_id) WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.uid() = doctor_id);

DROP POLICY IF EXISTS "rehab exercises select own" ON public.rehabilitation_exercises;
CREATE POLICY "rehab exercises select own" ON public.rehabilitation_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_exercises.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab exercises insert own" ON public.rehabilitation_exercises;
CREATE POLICY "rehab exercises insert own" ON public.rehabilitation_exercises FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_exercises.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));

DROP POLICY IF EXISTS "rehab joint metrics select own" ON public.rehabilitation_joint_metrics;
CREATE POLICY "rehab joint metrics select own" ON public.rehabilitation_joint_metrics FOR SELECT USING (EXISTS (SELECT 1 FROM public.rehabilitation_exercises e JOIN public.rehabilitation_sessions s ON s.id = e.session_id WHERE e.id = rehabilitation_joint_metrics.exercise_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab joint metrics insert own" ON public.rehabilitation_joint_metrics;
CREATE POLICY "rehab joint metrics insert own" ON public.rehabilitation_joint_metrics FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_exercises e JOIN public.rehabilitation_sessions s ON s.id = e.session_id WHERE e.id = rehabilitation_joint_metrics.exercise_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));

DROP POLICY IF EXISTS "rehab plans select own" ON public.rehabilitation_plans;
CREATE POLICY "rehab plans select own" ON public.rehabilitation_plans FOR SELECT USING (auth.uid() = doctor_id OR doctor_id IS NULL);
DROP POLICY IF EXISTS "rehab plans insert own" ON public.rehabilitation_plans;
CREATE POLICY "rehab plans insert own" ON public.rehabilitation_plans FOR INSERT WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);
DROP POLICY IF EXISTS "rehab plans update own" ON public.rehabilitation_plans;
CREATE POLICY "rehab plans update own" ON public.rehabilitation_plans FOR UPDATE USING (auth.uid() = doctor_id OR doctor_id IS NULL) WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);

-- Reabilitatsiya AI tahlili: AI ishlamasa ham status saqlanadi, eski jadvallar o'zgartirilmaydi.
CREATE TABLE IF NOT EXISTS public.rehabilitation_ai_analyses (
  id text PRIMARY KEY,
  session_id text REFERENCES public.rehabilitation_sessions(id) ON DELETE CASCADE,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_provider text NOT NULL DEFAULT 'abdulloh-ai-server',
  analysis_status text NOT NULL DEFAULT 'pending',
  overall_summary text NOT NULL DEFAULT '',
  movement_quality_analysis text NOT NULL DEFAULT '',
  joint_problem_analysis text NOT NULL DEFAULT '',
  symmetry_analysis text NOT NULL DEFAULT '',
  fatigue_analysis text NOT NULL DEFAULT '',
  progress_comparison text NOT NULL DEFAULT '',
  risk_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  patient_advice text NOT NULL DEFAULT '',
  doctor_clinical_note text NOT NULL DEFAULT '',
  next_exercise_recommendation text NOT NULL DEFAULT '',
  safety_note text NOT NULL DEFAULT '',
  raw_ai_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rehabilitation_ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rehab_ai_session_id ON public.rehabilitation_ai_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_rehab_ai_patient_id ON public.rehabilitation_ai_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_ai_status ON public.rehabilitation_ai_analyses(analysis_status);

DROP POLICY IF EXISTS "rehab ai analyses select own" ON public.rehabilitation_ai_analyses;
CREATE POLICY "rehab ai analyses select own" ON public.rehabilitation_ai_analyses FOR SELECT USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_ai_analyses.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab ai analyses insert own" ON public.rehabilitation_ai_analyses;
CREATE POLICY "rehab ai analyses insert own" ON public.rehabilitation_ai_analyses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_ai_analyses.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab ai analyses update own" ON public.rehabilitation_ai_analyses;
CREATE POLICY "rehab ai analyses update own" ON public.rehabilitation_ai_analyses FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_ai_analyses.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehabilitation_ai_analyses.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));

-- Smart Rehab Digital Twin kengaytmalari: mavjud reabilitatsiya jadvallarini buzmasdan alohida saqlanadi.
CREATE TABLE IF NOT EXISTS public.smart_rehab_digital_twins (
  id text PRIMARY KEY,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  baseline_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  movement_signature text NOT NULL DEFAULT '',
  weak_joints jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  compensation_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  fatigue_pattern text NOT NULL DEFAULT '',
  pain_pattern text NOT NULL DEFAULT '',
  recovery_stage text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehab_adaptive_protocols (
  id text PRIMARY KEY,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  current_level integer NOT NULL DEFAULT 1,
  next_level integer NOT NULL DEFAULT 1,
  recommendation_type text NOT NULL DEFAULT 'maintain',
  reason text NOT NULL DEFAULT '',
  exercise_adjustments jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehab_compensation_metrics (
  id text PRIMARY KEY,
  session_id text REFERENCES public.rehabilitation_sessions(id) ON DELETE CASCADE,
  patient_id text,
  exercise_id text,
  compensation_index integer NOT NULL DEFAULT 0,
  compensation_type text NOT NULL DEFAULT '',
  affected_body_part text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'low',
  correction_advice text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehab_safe_progression_scores (
  id text PRIMARY KEY,
  session_id text REFERENCES public.rehabilitation_sessions(id) ON DELETE CASCADE,
  patient_id text,
  score integer NOT NULL DEFAULT 0,
  pain_score integer NOT NULL DEFAULT 0,
  fatigue_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'caution',
  recommendation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehab_recovery_trajectories (
  id text PRIMARY KEY,
  patient_id text,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  period_days integer NOT NULL DEFAULT 7,
  progress_summary text NOT NULL DEFAULT '',
  slow_recovery_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  improved_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  predicted_next_status text NOT NULL DEFAULT '',
  doctor_recommendation text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rehab_neurogame_results (
  id text PRIMARY KEY,
  patient_id text,
  session_id text REFERENCES public.rehabilitation_sessions(id) ON DELETE CASCADE,
  game_name text NOT NULL DEFAULT '',
  target_body_part text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  accuracy integer NOT NULL DEFAULT 0,
  reaction_time numeric NOT NULL DEFAULT 0,
  movement_quality integer NOT NULL DEFAULT 0,
  compensation_index integer NOT NULL DEFAULT 0,
  fatigue_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_rehab_digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehab_adaptive_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehab_compensation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehab_safe_progression_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehab_recovery_trajectories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehab_neurogame_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_smart_rehab_twins_patient_id ON public.smart_rehab_digital_twins(patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_adaptive_protocols_patient_id ON public.rehab_adaptive_protocols(patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_comp_metrics_session_id ON public.rehab_compensation_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_rehab_safe_scores_session_id ON public.rehab_safe_progression_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_rehab_trajectories_patient_id ON public.rehab_recovery_trajectories(patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_neurogame_session_id ON public.rehab_neurogame_results(session_id);

DROP POLICY IF EXISTS "smart rehab twins own" ON public.smart_rehab_digital_twins;
CREATE POLICY "smart rehab twins own" ON public.smart_rehab_digital_twins FOR ALL USING (auth.uid() = doctor_id OR doctor_id IS NULL) WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);
DROP POLICY IF EXISTS "rehab adaptive protocols own" ON public.rehab_adaptive_protocols;
CREATE POLICY "rehab adaptive protocols own" ON public.rehab_adaptive_protocols FOR ALL USING (auth.uid() = doctor_id OR doctor_id IS NULL) WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);
DROP POLICY IF EXISTS "rehab compensation own" ON public.rehab_compensation_metrics;
CREATE POLICY "rehab compensation own" ON public.rehab_compensation_metrics FOR ALL USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_compensation_metrics.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_compensation_metrics.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab safe scores own" ON public.rehab_safe_progression_scores;
CREATE POLICY "rehab safe scores own" ON public.rehab_safe_progression_scores FOR ALL USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_safe_progression_scores.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_safe_progression_scores.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
DROP POLICY IF EXISTS "rehab trajectories own" ON public.rehab_recovery_trajectories;
CREATE POLICY "rehab trajectories own" ON public.rehab_recovery_trajectories FOR ALL USING (auth.uid() = doctor_id OR doctor_id IS NULL) WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);
DROP POLICY IF EXISTS "rehab neurogame own" ON public.rehab_neurogame_results;
CREATE POLICY "rehab neurogame own" ON public.rehab_neurogame_results FOR ALL USING (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_neurogame_results.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.rehabilitation_sessions s WHERE s.id = rehab_neurogame_results.session_id AND (s.user_id = auth.uid() OR s.user_id IS NULL OR s.doctor_id = auth.uid())));
