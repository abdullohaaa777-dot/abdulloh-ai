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
