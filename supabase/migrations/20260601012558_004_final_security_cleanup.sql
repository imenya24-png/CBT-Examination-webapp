/*
  # Final Security Cleanup

  1. Remove remaining permissive anonymous policies
    - att_records: Drop attrec_insert_anon, keep attrec_insert_student
    - att_edit_requests: Drop attreq_insert_anon, keep attreq_insert_student
  
  2. Student-validated policies check:
    - For att_records: student exists OR studentId provided, session is open
    - For att_edit_requests: classSN and studentName are not empty
*/

-- Drop remaining permissive anonymous policies
DROP POLICY IF EXISTS "attrec_insert_anon" ON att_records;
DROP POLICY IF EXISTS "attreq_insert_anon" ON att_edit_requests;

-- Ensure student-validated policies exist for att_edit_requests if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'att_edit_requests' 
    AND policyname = 'attreq_insert_student'
  ) THEN
    CREATE POLICY "attreq_insert_student" ON att_edit_requests
      FOR INSERT
      WITH CHECK (
        "classSN" IS NOT NULL 
        AND "classSN" != ''
        AND "studentName" IS NOT NULL
        AND "studentName" != ''
      );
  END IF;
END $$;

SELECT 1;