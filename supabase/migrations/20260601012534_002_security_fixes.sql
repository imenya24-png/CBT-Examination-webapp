/*
  # Security Fixes for RLS Policies

  1. Security Changes
    - Fixed `has_submitted_exam` function: Changed to SECURITY INVOKER
    - Added validation to INSERT policies to prevent abuse
    - Require valid email format for all anonymous inserts
    - Add constraint validation for status fields
  
  2. Why Some Policies Allow Anonymous Access
    - Students taking exams are NOT authenticated via Supabase Auth
    - They access via email + serial number verification
    - Anonymous INSERT needed for exam submission, but now validated
*/

-- Fix 1: Change has_submitted_exam to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.has_submitted_exam(student_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.results
    WHERE LOWER(email) = LOWER(student_email)
  );
$$;

REVOKE ALL ON FUNCTION public.has_submitted_exam(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_submitted_exam(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.has_submitted_exam(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_submitted_exam(TEXT) TO anon, authenticated;

-- Fix 2: Update exam_sessions INSERT policy with email validation
DROP POLICY IF EXISTS "sessions_insert_anon" ON exam_sessions;
CREATE POLICY "sessions_insert_anon" ON exam_sessions 
  FOR INSERT 
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND status IN ('active', 'completed')
  );

-- Fix 3: Update exam_sessions UPDATE policy with validation
DROP POLICY IF EXISTS "sessions_update_anon" ON exam_sessions;
CREATE POLICY "sessions_update_anon" ON exam_sessions 
  FOR UPDATE 
  USING (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
  WITH CHECK (
    status IN ('active', 'completed')
    AND "lastSeen" IS NOT NULL
  );

-- Fix 4: Update violations INSERT policy with validation
DROP POLICY IF EXISTS "violations_insert_anon" ON violations;
CREATE POLICY "violations_insert_anon" ON violations 
  FOR INSERT 
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND type IS NOT NULL 
    AND type IN ('tab_switch', 'visibility_change', 'network_disconnect', 'copy_paste', 'other')
  );

-- Fix 5: Update results INSERT policy with validation
DROP POLICY IF EXISTS "results_insert_anon" ON results;
CREATE POLICY "results_insert_anon" ON results 
  FOR INSERT 
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND score IS NOT NULL 
    AND score >= 0
    AND total IS NOT NULL 
    AND total >= 0
    AND percentage IS NOT NULL
    AND percentage >= 0 
    AND percentage <= 100
  );

-- Fix 6: Update att_records INSERT policy with validation
DROP POLICY IF EXISTS "attrec_insert_anon" ON att_records;
CREATE POLICY "attrec_insert_anon" ON att_records 
  FOR INSERT 
  WITH CHECK (
    email IS NOT NULL 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND "sessionId" IS NOT NULL
    AND status IN ('present', 'absent', 'late', 'excused')
  );

-- Fix 7: Update att_edit_requests INSERT policy with validation
DROP POLICY IF EXISTS "attreq_insert_anon" ON att_edit_requests;
CREATE POLICY "attreq_insert_anon" ON att_edit_requests 
  FOR INSERT 
  WITH CHECK (
    "classSN" IS NOT NULL 
    AND "classSN" != ''
    AND "newStatus" IN ('present', 'absent', 'late', 'excused')
    AND "currentStatus" IN ('present', 'absent', 'late', 'excused')
    AND status = 'pending'
  );