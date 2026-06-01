/*
  # Initial CBT Database Schema
  
  1. New Tables
    - `config`: Stores exam settings (title, duration, questions count, etc.)
    - `students`: Student records (id, name, email, class, serial number)
    - `questions`: Exam questions (type, text, options, answer, level, section)
    - `results`: Exam submissions (student, score, answers, violations)
    - `violations`: Security violations during exam
    - `exam_sessions`: Live exam monitoring (active/completed status)
    - `admin_profiles`: Admin accounts with permissions (superadmin/tutor roles)
    - `att_sessions`: Attendance session management
    - `att_records`: Individual attendance records
    - `att_edit_requests`: Student requests to correct attendance
    - `admin_logs`: Activity logging for admin actions
  
  2. Security (RLS)
    - All tables have Row Level Security enabled
    - Students can read questions, submit results, and mark attendance
    - Only authenticated admins can modify questions, students, and view results
    - Anonymous access limited to what's needed for exam functionality
  
  3. Functions
    - `has_submitted_exam(email)`: Check if student already submitted
*/

-- TABLE: config (single-row settings table)
CREATE TABLE IF NOT EXISTS config (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  data    JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS config_single_row ON config ((id = 1));

-- TABLE: students
CREATE TABLE IF NOT EXISTS students (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  "classSN"   TEXT,
  class       TEXT,
  gender      TEXT,
  phone       TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ
);

-- TABLE: questions
CREATE TABLE IF NOT EXISTS questions (
  id       TEXT PRIMARY KEY,
  type     TEXT NOT NULL,
  text     TEXT NOT NULL,
  options  JSONB,
  answer   JSONB,
  level    TEXT DEFAULT 'medium',
  section  TEXT
);

-- TABLE: results
CREATE TABLE IF NOT EXISTS results (
  id            TEXT PRIMARY KEY,
  "studentName" TEXT,
  email         TEXT NOT NULL,
  class         TEXT,
  score         INTEGER DEFAULT 0,
  total         INTEGER DEFAULT 0,
  percentage    INTEGER DEFAULT 0,
  violations    INTEGER DEFAULT 0,
  "timeTaken"   INTEGER DEFAULT 0,
  reason        TEXT,
  answers       JSONB,
  questions     JSONB,
  "submittedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS results_one_submission_per_email ON results (LOWER(email));

-- TABLE: violations
CREATE TABLE IF NOT EXISTS violations (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  "studentName" TEXT,
  type          TEXT,
  detail        TEXT,
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: exam_sessions (live exam monitoring)
CREATE TABLE IF NOT EXISTS exam_sessions (
  email         TEXT PRIMARY KEY,
  name          TEXT,
  class         TEXT,
  status        TEXT DEFAULT 'active',
  "startedAt"   TIMESTAMPTZ DEFAULT NOW(),
  "lastSeen"    TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ
);

-- TABLE: admin_profiles (administrator and tutor permission profiles)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL,
  name              TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'tutor',
  "classAssignment" TEXT DEFAULT 'Class A',
  "allowAttendance" BOOLEAN DEFAULT TRUE,
  "allowStudents"   BOOLEAN DEFAULT FALSE,
  "allowQuestions"  BOOLEAN DEFAULT FALSE,
  "allowResults"    BOOLEAN DEFAULT FALSE,
  "allowSessions"   BOOLEAN DEFAULT FALSE,
  "allowSettings"   BOOLEAN DEFAULT FALSE,
  "allowViolations" BOOLEAN DEFAULT FALSE,
  "allowLogs"       BOOLEAN DEFAULT FALSE,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: att_sessions (attendance sessions)
CREATE TABLE IF NOT EXISTS att_sessions (
  id              TEXT PRIMARY KEY,
  class           TEXT,
  date            TEXT,
  topic           TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'open',
  "round1Serials" JSONB DEFAULT '[]'::JSONB,
  "round2Serials" JSONB DEFAULT '[]'::JSONB,
  "createdBy"     TEXT,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "closedAt"      TIMESTAMPTZ,
  "importedFromCSV" BOOLEAN DEFAULT FALSE
);

-- TABLE: att_records (per-student attendance records)
CREATE TABLE IF NOT EXISTS att_records (
  id            TEXT PRIMARY KEY,
  "sessionId"   TEXT REFERENCES att_sessions(id) ON DELETE CASCADE,
  date          TEXT,
  "studentId"   TEXT,
  "studentName" TEXT,
  email         TEXT,
  class         TEXT,
  "classSN"     TEXT,
  status        TEXT DEFAULT 'present',
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: att_edit_requests
CREATE TABLE IF NOT EXISTS att_edit_requests (
  id              TEXT PRIMARY KEY,
  "sessionId"     TEXT,
  "recordId"      TEXT,
  "classSN"       TEXT,
  "studentName"   TEXT,
  "currentStatus" TEXT,
  "newStatus"     TEXT,
  reason          TEXT,
  status          TEXT DEFAULT 'pending',
  "requestedAt"   TIMESTAMPTZ DEFAULT NOW(),
  "resolvedAt"    TIMESTAMPTZ
);

-- TABLE: admin_logs (activity log)
CREATE TABLE IF NOT EXISTS admin_logs (
  id        TEXT PRIMARY KEY,
  action    TEXT NOT NULL,
  category  TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE config            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;

-- RLS Policies: config
CREATE POLICY "config_read_all"    ON config FOR SELECT USING (true);
CREATE POLICY "config_write_auth"  ON config FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: students
CREATE POLICY "students_read_anon"  ON students FOR SELECT USING (true);
CREATE POLICY "students_write_auth" ON students FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: questions
CREATE POLICY "questions_read_anon"  ON questions FOR SELECT USING (true);
CREATE POLICY "questions_write_auth" ON questions FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: results
CREATE POLICY "results_insert_anon" ON results FOR INSERT WITH CHECK (true);
CREATE POLICY "results_read_auth"   ON results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "results_delete_auth" ON results FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies: violations
CREATE POLICY "violations_insert_anon" ON violations FOR INSERT WITH CHECK (true);
CREATE POLICY "violations_read_auth"   ON violations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "violations_delete_auth" ON violations FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies: exam_sessions
CREATE POLICY "sessions_insert_anon" ON exam_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update_anon" ON exam_sessions FOR UPDATE USING (true);
CREATE POLICY "sessions_read_auth"   ON exam_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sessions_delete_auth" ON exam_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies: att_sessions
CREATE POLICY "attsess_read_anon"  ON att_sessions FOR SELECT USING (true);
CREATE POLICY "attsess_write_auth" ON att_sessions FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: admin_profiles
CREATE POLICY "profiles_read_all" ON admin_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write_auth" ON admin_profiles FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: att_records
CREATE POLICY "attrec_insert_anon" ON att_records FOR INSERT WITH CHECK (true);
CREATE POLICY "attrec_read_auth"   ON att_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "attrec_write_auth"  ON att_records FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: att_edit_requests
CREATE POLICY "attreq_insert_anon" ON att_edit_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "attreq_all_auth"    ON att_edit_requests FOR ALL    USING (auth.role() = 'authenticated');

-- RLS Policies: admin_logs
CREATE POLICY "logs_all_auth" ON admin_logs FOR ALL USING (auth.role() = 'authenticated');

-- Function: Check if student already submitted
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

-- Seed: Default config row
INSERT INTO config (id, data) VALUES (1, '{
  "badgeText": "Enterprise Python - Backend Development",
  "mainTitle": "Python Basic Fundamental",
  "subtitle": "",
  "examLabel": "Test of knowledge",
  "description": "Programming - Algorithm - Pseudocode",
  "examTitle": "Test of knowledge",
  "totalQuestions": 50,
  "questionsToAttempt": 30,
  "duration": 30,
  "allowBackNav": false,
  "allowReview": true,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "maxViolations": 5,
  "networkGrace": 10,
  "monitorVisibility": true,
  "maxVisibilityViolations": 8,
  "showScoreAfter": true,
  "showCorrectAnswers": true,
  "examActive": true,
  "adminEmail": "admin@cbt.com",
  "protectionPassword": "secure123"
}'::JSONB)
ON CONFLICT (id) DO NOTHING;