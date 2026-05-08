-- Organlararo Bioelektr Indeks natijalari uchun jadval
-- Mavjud cases jadvali va auth.users bilan mos, RLS himoyasi yoqilgan.

CREATE TABLE IF NOT EXISTS organ_bioelectric_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  overall_index INTEGER NOT NULL CHECK (overall_index BETWEEN 0 AND 100),
  organ_scores JSONB NOT NULL,
  internal_indexes JSONB NOT NULL,
  network_edges JSONB NOT NULL,
  top_problems JSONB NOT NULL,
  ai_summary TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  raw_test_summary TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('past', 'o‘rtacha', 'yuqori')),
  disclaimer_shown BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE organ_bioelectric_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own organ bioelectric results" ON organ_bioelectric_results
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS organ_bioelectric_results_user_created_idx
  ON organ_bioelectric_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS organ_bioelectric_results_patient_created_idx
  ON organ_bioelectric_results(patient_id, created_at DESC);
