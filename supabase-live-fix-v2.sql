-- ============================================================
-- SecureCBT — Supabase Database Migration (Tutor RBAC Controls)
-- Run this script in your Supabase SQL Editor to enable multiple 
-- tutor accounts, granular permissions, and action auditing!
-- ============================================================

-- ── TABLE: admin_profiles ──
CREATE TABLE IF NOT EXISTS admin_profiles (
  id                TEXT PRIMARY KEY, -- matches auth.users.id
  email             TEXT NOT NULL,
  name              TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'tutor', -- 'superadmin' or 'tutor'
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

-- Enable Row Level Security (RLS)
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "profiles_read_all" ON admin_profiles;
DROP POLICY IF EXISTS "profiles_write_auth" ON admin_profiles;

CREATE POLICY "profiles_read_all" ON admin_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_write_auth" ON admin_profiles FOR ALL USING (auth.role() = 'authenticated');

-- ── AUDIT UPGRADES ON admin_logs ──
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS "admin_email" TEXT;
ALTER TABLE admin_logs ADD COLUMN IF NOT EXISTS "admin_name" TEXT;
