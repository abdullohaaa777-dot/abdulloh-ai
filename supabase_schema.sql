-- SQL Schema for Abdulloh AI

-- 1. Cases Table
CREATE TABLE cases (
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

-- 2. Uploads Table
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Chats Table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage their own cases" ON cases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage uploads for their cases" ON uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = uploads.case_id 
      AND cases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage chats for their cases" ON chats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases 
      WHERE cases.id = chats.case_id 
      AND cases.user_id = auth.uid()
    )
  );

-- 6. Storage Bucket
-- Create a bucket named 'medical-uploads' in Supabase Storage dashboard
-- Set policy for 'medical-uploads' bucket:
-- (auth.uid()::text = (storage.foldername(name))[1])
