-- CASES table: add all fields used by the Angular form and AI service
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS living_conditions TEXT,
  ADD COLUMN IF NOT EXISTS air_quality TEXT,
  ADD COLUMN IF NOT EXISTS ecological_cleanliness TEXT,
  ADD COLUMN IF NOT EXISTS dbp INTEGER,
  ADD COLUMN IF NOT EXISTS height NUMERIC,
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS history TEXT,
  ADD COLUMN IF NOT EXISTS hemoglobin NUMERIC,
  ADD COLUMN IF NOT EXISTS wbc NUMERIC,
  ADD COLUMN IF NOT EXISTS platelets NUMERIC,
  ADD COLUMN IF NOT EXISTS glucose NUMERIC,
  ADD COLUMN IF NOT EXISTS creatinine NUMERIC,
  ADD COLUMN IF NOT EXISTS creatinine_unit TEXT,
  ADD COLUMN IF NOT EXISTS ldl NUMERIC,
  ADD COLUMN IF NOT EXISTS hdl NUMERIC,
  ADD COLUMN IF NOT EXISTS triglycerides NUMERIC,
  ADD COLUMN IF NOT EXISTS crp NUMERIC,
  ADD COLUMN IF NOT EXISTS troponin NUMERIC,
  ADD COLUMN IF NOT EXISTS alt NUMERIC,
  ADD COLUMN IF NOT EXISTS ast NUMERIC,
  ADD COLUMN IF NOT EXISTS sodium NUMERIC,
  ADD COLUMN IF NOT EXISTS potassium NUMERIC,
  ADD COLUMN IF NOT EXISTS chloride NUMERIC,
  ADD COLUMN IF NOT EXISTS bicarbonate NUMERIC,
  ADD COLUMN IF NOT EXISTS albumin NUMERIC,
  ADD COLUMN IF NOT EXISTS calcium NUMERIC,
  ADD COLUMN IF NOT EXISTS bilirubin NUMERIC,
  ADD COLUMN IF NOT EXISTS inr NUMERIC,
  ADD COLUMN IF NOT EXISTS bun NUMERIC,
  ADD COLUMN IF NOT EXISTS mcv NUMERIC,
  ADD COLUMN IF NOT EXISTS mch NUMERIC,
  ADD COLUMN IF NOT EXISTS mchc NUMERIC,
  ADD COLUMN IF NOT EXISTS ferritin NUMERIC,
  ADD COLUMN IF NOT EXISTS iron NUMERIC,
  ADD COLUMN IF NOT EXISTS tibc NUMERIC,
  ADD COLUMN IF NOT EXISTS vitamin_b12 NUMERIC,
  ADD COLUMN IF NOT EXISTS folate NUMERIC,
  ADD COLUMN IF NOT EXISTS reticulocytes NUMERIC,
  ADD COLUMN IF NOT EXISTS ldh NUMERIC,
  ADD COLUMN IF NOT EXISTS haptoglobin NUMERIC,
  ADD COLUMN IF NOT EXISTS measured_osmolality NUMERIC,
  ADD COLUMN IF NOT EXISTS urine_na NUMERIC,
  ADD COLUMN IF NOT EXISTS urine_creatinine NUMERIC,
  ADD COLUMN IF NOT EXISTS ascites TEXT,
  ADD COLUMN IF NOT EXISTS encephalopathy TEXT,
  ADD COLUMN IF NOT EXISTS rr INTEGER,
  ADD COLUMN IF NOT EXISTS gcs_less_15 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS chf BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hypertension BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stroke_history BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vascular_disease BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS diabetes_history BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lab_text TEXT;

-- Upload metadata used by the UI
ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Safer RLS policies for inserts/selects/updates/deletes
DROP POLICY IF EXISTS "Users can manage their own cases" ON cases;
DROP POLICY IF EXISTS "Users can manage uploads for their cases" ON uploads;
DROP POLICY IF EXISTS "Users can manage chats for their cases" ON chats;

CREATE POLICY "Users can view their own cases" ON cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases" ON cases
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases" ON cases
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view uploads for own cases" ON uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert uploads for own cases" ON uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete uploads for own cases" ON uploads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = uploads.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view chats for own cases" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chats for own cases" ON chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chats for own cases" ON chats
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = chats.case_id
        AND cases.user_id = auth.uid()
    )
  );
