/*
  # Create upsert function for admin profiles

  This function allows the edge function to upsert admin profiles
  without RLS restrictions.
*/

CREATE OR REPLACE FUNCTION public.upsert_admin_profile(
  p_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_allow_students boolean DEFAULT false,
  p_allow_questions boolean DEFAULT false,
  p_allow_results boolean DEFAULT false,
  p_allow_sessions boolean DEFAULT false,
  p_allow_violations boolean DEFAULT false,
  p_allow_attendance boolean DEFAULT false,
  p_allow_settings boolean DEFAULT false,
  p_allow_logs boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_profiles (
    id, email, name, role,
    "allowStudents", "allowQuestions", "allowResults", 
    "allowSessions", "allowViolations", "allowAttendance",
    "allowSettings", "allowLogs"
  ) VALUES (
    p_id, p_email, p_name, p_role,
    p_allow_students, p_allow_questions, p_allow_results,
    p_allow_sessions, p_allow_violations, p_allow_attendance,
    p_allow_settings, p_allow_logs
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    "allowStudents" = EXCLUDED."allowStudents",
    "allowQuestions" = EXCLUDED."allowQuestions",
    "allowResults" = EXCLUDED."allowResults",
    "allowSessions" = EXCLUDED."allowSessions",
    "allowViolations" = EXCLUDED."allowViolations",
    "allowAttendance" = EXCLUDED."allowAttendance",
    "allowSettings" = EXCLUDED."allowSettings",
    "allowLogs" = EXCLUDED."allowLogs";
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_admin_profile TO authenticated, anon, service_role;