-- Homeostaz AI natijalari uchun non-destructive migration.
-- Eski jadvallar o‘zgartirilmaydi; RLS auth.uid() = user_id prinsipiga asoslanadi.

CREATE TABLE IF NOT EXISTS homeostasis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  input_data JSONB NOT NULL,
  calculated_scores JSONB NOT NULL,
  ai_analysis TEXT NOT NULL,
  trend_status TEXT NOT NULL CHECK (trend_status IN ('barqaror', 'sekin yomonlashish', 'tez yomonlashish', 'tiklanish ehtimoli bor')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Past xavf', 'O‘rta xavf', 'Yuqori xavf', 'Kritik signal')),
  five_year_projection JSONB NOT NULL,
  ten_year_projection JSONB NOT NULL,
  organ_interaction_map JSONB NOT NULL,
  recommendations JSONB NOT NULL
);

ALTER TABLE homeostasis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own homeostasis results" ON homeostasis_results
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS homeostasis_results_user_created_idx
  ON homeostasis_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS homeostasis_results_patient_created_idx
  ON homeostasis_results(patient_id, created_at DESC);
