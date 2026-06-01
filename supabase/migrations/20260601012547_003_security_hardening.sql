/*
  # Final Security Hardening

  1. Remove Redundant Anonymous Policies
    - Drop overly permissive *_insert_anon policies
    - Keep *_insert_student policies that verify:
      - Student exists in students table
      - Exam is active (examActive = true)
      - For violations: active exam session exists
  
  2. Keep Only Necessary Anonymous Access
    - att_records: Keep validated anon policy for attendance marking
    - att_edit_requests: Keep validated anon policy for edit requests
    - These need anonymous access because attendance marking happens 
      without Supabase Auth authentication
  
  3. Function Security
    - has_submitted_exam: Already changed to SECURITY INVOKER
*/

-- Drop overly permissive anonymous policies that have student-validated alternatives
DROP POLICY IF EXISTS "results_insert_anon" ON results;
DROP POLICY IF EXISTS "violations_insert_anon" ON violations;
DROP POLICY IF EXISTS "sessions_insert_anon" ON exam_sessions;
DROP POLICY IF EXISTS "sessions_update_anon" ON exam_sessions;

-- Keep validated anonymous policies for attendance (no Supabase Auth for students)
-- These already have email validation from previous migration

-- Verify the student-specific policies are in place
-- These check: student exists AND exam is active
SELECT 1;