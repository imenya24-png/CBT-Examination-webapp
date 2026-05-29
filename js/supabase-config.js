// ============================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================
// Initialize the Supabase client (loaded via CDN in each HTML page)
const SUPABASE_URL      = 'https://wkcwhwyyfwqfytknpsfz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dMlZjf82zwuFQ6KV8hmRFg_kFPdh9Id';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
var supabase = window.supabase;
