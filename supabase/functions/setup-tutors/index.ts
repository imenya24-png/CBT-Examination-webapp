import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Tutor {
  email: string;
  password: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}

const tutors: Tutor[] = [
  {
    email: 'ime.nya@cbt.com',
    password: 'Tutor123!Ime',
    name: 'Ime Nya',
    role: 'tutor',
    permissions: {
      allowStudents: true,
      allowQuestions: false,
      allowResults: true,
      allowSessions: true,
      allowViolations: true,
      allowAttendance: true,
      allowSettings: false,
      allowLogs: false
    }
  },
  {
    email: 'promise.choke@cbt.com',
    password: 'Tutor123!Promise',
    name: 'Promise Choke',
    role: 'tutor',
    permissions: {
      allowStudents: true,
      allowQuestions: false,
      allowResults: true,
      allowSessions: true,
      allowViolations: true,
      allowAttendance: true,
      allowSettings: false,
      allowLogs: false
    }
  },
  {
    email: 'john@cbt.com',
    password: 'Tutor123!John',
    name: 'John',
    role: 'tutor',
    permissions: {
      allowStudents: true,
      allowQuestions: false,
      allowResults: true,
      allowSessions: true,
      allowViolations: true,
      allowAttendance: true,
      allowSettings: false,
      allowLogs: false
    }
  },
  {
    email: 'ezuiche@cbt.com',
    password: 'Tutor123!Ezuiche',
    name: 'Ezuiche',
    role: 'admin',
    permissions: {
      allowStudents: true,
      allowQuestions: true,
      allowResults: true,
      allowSessions: true,
      allowViolations: true,
      allowAttendance: true,
      allowSettings: true,
      allowLogs: true
    }
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    const results = [];

    for (const tutor of tutors) {
      try {
        // Create the user using signup endpoint
        const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            email: tutor.email,
            password: tutor.password,
            email_confirm: true,
            user_metadata: {
              name: tutor.name,
              role: tutor.role
            }
          })
        });

        const newUser = await createResponse.json();
        let userId = newUser?.user?.id || newUser?.id;

        if (!userId && newUser?.error) {
          // User might already exist, try to get their ID
          const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(tutor.email)}`, {
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          });
          const existingUsers = await listResponse.json();
          if (existingUsers.users && existingUsers.users.length > 0) {
            userId = existingUsers.users[0].id;
          }
        }

        if (!userId) {
          results.push({
            email: tutor.email,
            success: false,
            error: newUser?.message || newUser?.error?.message || 'Unknown error creating user',
            details: newUser
          });
          continue;
        }

        // Create profile record using upsert
        const profileData = {
          id: userId,
          email: tutor.email,
          name: tutor.name,
          role: tutor.role,
          ...tutor.permissions
        };

        // Use raw SQL via REST API with upsert
        const upsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_admin_profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            p_id: userId,
            p_email: tutor.email,
            p_name: tutor.name,
            p_role: tutor.role,
            p_allow_students: tutor.permissions.allowStudents,
            p_allow_questions: tutor.permissions.allowQuestions,
            p_allow_results: tutor.permissions.allowResults,
            p_allow_sessions: tutor.permissions.allowSessions,
            p_allow_violations: tutor.permissions.allowViolations,
            p_allow_attendance: tutor.permissions.allowAttendance,
            p_allow_settings: tutor.permissions.allowSettings,
            p_allow_logs: tutor.permissions.allowLogs
          })
        });

        results.push({
          email: tutor.email,
          name: tutor.name,
          role: tutor.role,
          success: true,
          userId: userId,
          credentials: {
            email: tutor.email,
            password: tutor.password
          }
        });
      } catch (err) {
        results.push({
          email: tutor.email,
          success: false,
          error: err.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tutor users processed',
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
