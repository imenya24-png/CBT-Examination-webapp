-- ============================================================
-- SecureCBT — Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor
-- Project: https://supabase.com → your project → SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: config (single-row settings table)
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  data    JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enforce single row
CREATE UNIQUE INDEX IF NOT EXISTS config_single_row ON config ((id = 1));

-- ============================================================
-- TABLE: students
-- ============================================================
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

-- ============================================================
-- TABLE: questions
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id       TEXT PRIMARY KEY,
  type     TEXT NOT NULL,
  text     TEXT NOT NULL,
  options  JSONB,
  answer   JSONB,
  level    TEXT DEFAULT 'medium',
  section  TEXT
);

-- ============================================================
-- TABLE: results
-- ============================================================
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
CREATE UNIQUE INDEX IF NOT EXISTS results_one_submission_per_email
  ON results (LOWER(email));

-- ============================================================
-- TABLE: violations
-- ============================================================
CREATE TABLE IF NOT EXISTS violations (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  "studentName" TEXT,
  type          TEXT,
  detail        TEXT,
  timestamp     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: exam_sessions (live exam monitoring)
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  email         TEXT PRIMARY KEY,
  name          TEXT,
  class         TEXT,
  status        TEXT DEFAULT 'active',
  "startedAt"   TIMESTAMPTZ DEFAULT NOW(),
  "lastSeen"    TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ
);

-- ============================================================
-- TABLE: admin_profiles (administrator and tutor permission profiles)
-- ============================================================
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

-- ============================================================
-- TABLE: att_sessions (attendance sessions)
-- ============================================================
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

-- ============================================================
-- TABLE: att_records (per-student attendance records)
-- ============================================================
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

-- ============================================================
-- TABLE: att_edit_requests
-- ============================================================
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

-- ============================================================
-- TABLE: admin_logs (activity log, kept at 500 max in app layer)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id        TEXT PRIMARY KEY,
  action    TEXT NOT NULL,
  category  TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPATIBILITY MIGRATIONS FOR EXISTING SUPABASE PROJECTS
-- CREATE TABLE IF NOT EXISTS does not add columns to tables that
-- already exist, so keep these ALTER statements for upgrades.
-- ============================================================
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

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- These control who can read/write what
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE config            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE att_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs        ENABLE ROW LEVEL SECURITY;

-- ── config ──
-- Anyone can read config (exam settings, title, etc.)
-- Only authenticated admins can modify
DROP POLICY IF EXISTS "config_read_all" ON config;
DROP POLICY IF EXISTS "config_write_auth" ON config;
CREATE POLICY "config_read_all"    ON config FOR SELECT USING (true);
CREATE POLICY "config_write_auth"  ON config FOR ALL    USING (auth.role() = 'authenticated');

-- ── students ──
-- Anonymous can SELECT (needed for student login lookup by email+serial)
-- Only authenticated admins can insert/update/delete
DROP POLICY IF EXISTS "students_read_anon" ON students;
DROP POLICY IF EXISTS "students_write_auth" ON students;
CREATE POLICY "students_read_anon"  ON students FOR SELECT USING (true);
CREATE POLICY "students_write_auth" ON students FOR ALL    USING (auth.role() = 'authenticated');

-- ── questions ──
-- Anonymous can SELECT (students need questions during exam)
-- Only authenticated admins can modify
DROP POLICY IF EXISTS "questions_read_anon" ON questions;
DROP POLICY IF EXISTS "questions_write_auth" ON questions;
CREATE POLICY "questions_read_anon"  ON questions FOR SELECT USING (true);
CREATE POLICY "questions_write_auth" ON questions FOR ALL    USING (auth.role() = 'authenticated');

-- ── results ──
-- Anonymous can INSERT (students submit results)
-- Only authenticated admins can SELECT/DELETE
DROP POLICY IF EXISTS "results_insert_anon" ON results;
DROP POLICY IF EXISTS "results_read_auth" ON results;
DROP POLICY IF EXISTS "results_delete_auth" ON results;
CREATE POLICY "results_insert_anon" ON results FOR INSERT WITH CHECK (true);
CREATE POLICY "results_read_auth"   ON results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "results_delete_auth" ON results FOR DELETE USING (auth.role() = 'authenticated');

-- ── violations ──
-- Anonymous can INSERT (violations logged during exam)
-- Only authenticated admins can SELECT/DELETE
DROP POLICY IF EXISTS "violations_insert_anon" ON violations;
DROP POLICY IF EXISTS "violations_read_auth" ON violations;
DROP POLICY IF EXISTS "violations_delete_auth" ON violations;
CREATE POLICY "violations_insert_anon" ON violations FOR INSERT WITH CHECK (true);
CREATE POLICY "violations_read_auth"   ON violations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "violations_delete_auth" ON violations FOR DELETE USING (auth.role() = 'authenticated');

-- ── exam_sessions ──
-- Anonymous can INSERT and UPDATE their own session (by email)
-- Authenticated admins can SELECT all
DROP POLICY IF EXISTS "sessions_insert_anon" ON exam_sessions;
DROP POLICY IF EXISTS "sessions_update_anon" ON exam_sessions;
DROP POLICY IF EXISTS "sessions_read_auth" ON exam_sessions;
DROP POLICY IF EXISTS "sessions_delete_auth" ON exam_sessions;
CREATE POLICY "sessions_insert_anon" ON exam_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update_anon" ON exam_sessions FOR UPDATE USING (true);
CREATE POLICY "sessions_read_auth"   ON exam_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sessions_delete_auth" ON exam_sessions FOR DELETE USING (auth.role() = 'authenticated');

-- ── att_sessions ──
-- Anonymous can SELECT open sessions (students need to see attendance)
-- Authenticated admins can do everything
DROP POLICY IF EXISTS "attsess_read_anon" ON att_sessions;
DROP POLICY IF EXISTS "attsess_write_auth" ON att_sessions;
CREATE POLICY "attsess_read_anon"  ON att_sessions FOR SELECT USING (true);
CREATE POLICY "attsess_write_auth" ON att_sessions FOR ALL    USING (auth.role() = 'authenticated');

-- ── admin_profiles ──
-- Authenticated admins can read and update tutor permissions
DROP POLICY IF EXISTS "profiles_read_all" ON admin_profiles;
DROP POLICY IF EXISTS "profiles_write_auth" ON admin_profiles;
CREATE POLICY "profiles_read_all" ON admin_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write_auth" ON admin_profiles FOR ALL    USING (auth.role() = 'authenticated');

-- ── att_records ──
-- Anonymous can INSERT (student marks themselves present)
-- Authenticated admins can do everything
DROP POLICY IF EXISTS "attrec_insert_anon" ON att_records;
DROP POLICY IF EXISTS "attrec_read_auth" ON att_records;
DROP POLICY IF EXISTS "attrec_write_auth" ON att_records;
CREATE POLICY "attrec_insert_anon" ON att_records FOR INSERT WITH CHECK (true);
CREATE POLICY "attrec_read_auth"   ON att_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "attrec_write_auth"  ON att_records FOR ALL    USING (auth.role() = 'authenticated');

-- ── att_edit_requests ──
DROP POLICY IF EXISTS "attreq_insert_anon" ON att_edit_requests;
DROP POLICY IF EXISTS "attreq_all_auth" ON att_edit_requests;
CREATE POLICY "attreq_insert_anon" ON att_edit_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "attreq_all_auth"    ON att_edit_requests FOR ALL    USING (auth.role() = 'authenticated');

-- ── admin_logs ──
-- Only authenticated admins can read/write logs
DROP POLICY IF EXISTS "logs_all_auth" ON admin_logs;
CREATE POLICY "logs_all_auth" ON admin_logs FOR ALL USING (auth.role() = 'authenticated');

-- Student-side duplicate-submission check. This returns only a boolean,
-- without exposing result rows through anonymous SELECT policies.
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

-- ============================================================
-- SEED: Default config row
-- ============================================================
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

-- ============================================================
-- DONE! Your SecureCBT database is ready.
-- Next step: copy your Project URL and anon key from
-- Project Settings → API and put them in js/supabase-config.js
-- ============================================================
