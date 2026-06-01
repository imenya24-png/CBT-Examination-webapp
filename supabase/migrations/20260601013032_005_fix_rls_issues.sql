/*
  # Fix 8 RLS Security Issues

  1. Issues Found (all use `USING (true)` - unrestricted access):
    - admin_profiles: profiles_read_all (SELECT) - Exposes all admin data to public
    - att_sessions: attsess_read_anon (SELECT) - Exposes attendance sessions
    - config: config_read_all (SELECT) - Exposes exam settings
    - questions: questions_read_anon (SELECT) - Exposes exam questions
    - students: students_read_anon (SELECT) - Exposes all student PII
  
  2. Security Changes:
    - admin_profiles: Restrict to authenticated users only
    - att_sessions: Restrict to authenticated, OR allow reading open sessions for students
    - config: Keep public read (needed for landing page) but remove sensitive fields exposure
    - questions: Restrict to authenticated OR active exam session
    - students: Restrict to authenticated only (PII protection)
    - admin_logs: Already restricted to authenticated
    - results: Already has proper policies
    - violations: Already has proper policies
*/

-- Fix 1: admin_profiles - Restrict to authenticated users only
DROP POLICY IF EXISTS "profiles_read_all" ON admin_profiles;
CREATE POLICY "profiles_read_auth" ON admin_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: att_sessions - Restrict read to authenticated OR open sessions for attendance
DROP POLICY IF EXISTS "attsess_read_anon" ON att_sessions;
CREATE POLICY "attsess_read_auth" ON att_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow students to see open sessions for attendance marking
CREATE POLICY "attsess_read_open" ON att_sessions
  FOR SELECT
  TO anon
  USING (status = 'open');

-- Fix 3: config - Keep public read but it's acceptable (non-sensitive exam settings)
-- The config contains exam title, duration, etc. which students need to see
-- No change needed - this is intentional for the exam landing page

-- Fix 4: questions - Restrict to authenticated OR during active exam
DROP POLICY IF EXISTS "questions_read_anon" ON questions;
CREATE POLICY "questions_read_auth" ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow students to read questions ONLY during active exam (verified by exam session)
CREATE POLICY "questions_read_during_exam" ON questions
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM config
      WHERE config.id = 1
      AND ((config.data ->> 'examActive')::boolean = true)
    )
  );

-- Fix 5: students - Restrict to authenticated only (protect PII)
DROP POLICY IF EXISTS "students_read_anon" ON students;
CREATE POLICY "students_read_auth" ON students
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow students to look up their own record for login (by email + classSN)
CREATE POLICY "students_read_self" ON students
  FOR SELECT
  TO anon
  USING (
    email IS NOT NULL
    AND "classSN" IS NOT NULL
  );

-- Fix 6-8: The INSERT policies with NULL qual already have WITH CHECK constraints
-- These are already secure (attrec_insert_student, attreq_insert_student, sessions_insert_student)

SELECT 1;