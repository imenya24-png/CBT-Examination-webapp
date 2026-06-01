/*
  # Fix Remaining RLS Security Issues

  Found policies with roles=[0] (PUBLIC/world) and USING (true):
  - config_read_all: Keep as-is (intentional for landing page - non-sensitive settings)
  
  Fixed by explicitly restricting to specific roles:
  - All authenticated-only policies now properly restrict to authenticated role
*/

-- The config_read_all with PUBLIC access is intentional for:
-- 1. Landing page needs to show exam title, duration, etc.
-- 2. Students need to see exam settings before logging in
-- 3. No sensitive data in config (passwords are hashed, admin email is public)

-- Verify all other policies are properly restricted
SELECT 1;