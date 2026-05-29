-- SecureCBT live Supabase compatibility patch
-- Run this once in Supabase SQL Editor before testing the deployed app.

ALTER TABLE results ADD COLUMN IF NOT EXISTS "studentName" TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN IF NOT EXISTS violations INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN IF NOT EXISTS "timeTaken" INTEGER DEFAULT 0;
ALTER TABLE results ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE results ADD COLUMN IF NOT EXISTS questions JSONB;
ALTER TABLE results ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ;

ALTER TABLE att_sessions ADD COLUMN IF NOT EXISTS "importedFromCSV" BOOLEAN DEFAULT FALSE;
ALTER TABLE att_edit_requests ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS results_one_submission_per_email
  ON results (LOWER(email));

DROP POLICY IF EXISTS "students_read_anon" ON students;
CREATE POLICY "students_read_anon" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "questions_read_anon" ON questions;
CREATE POLICY "questions_read_anon" ON questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "results_insert_anon" ON results;
CREATE POLICY "results_insert_anon" ON results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "results_read_auth" ON results;
CREATE POLICY "results_read_auth" ON results FOR SELECT USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.has_submitted_exam(student_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.results
    WHERE LOWER(email) = LOWER(student_email)
  );
$$;

REVOKE ALL ON FUNCTION public.has_submitted_exam(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_submitted_exam(TEXT) TO anon, authenticated;
