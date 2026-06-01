// ============================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================
// Initialize the Supabase client (loaded via CDN in each HTML page)
const SUPABASE_URL      = 'https://mvmflcisridxbblnnwhp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWZsY2lzcmlkeGJibG5ud2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDc0OTEsImV4cCI6MjA5NTgyMzQ5MX0.sle8lsqVJ5kPY4TzHMzvHxxciyMUA7gwEkeGebmuQm8';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var supabase = window.supabase;
