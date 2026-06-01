import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();

    // Create admin user using Supabase Admin API
    const adminEmail = 'superadmin@cbt.com';
    const adminPassword = 'Admin123!SecureCBT';

    // Check if user already exists
    const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(adminEmail)}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const existingUsers = await listResponse.json();
    let userId;

    if (existingUsers.users && existingUsers.users.length > 0) {
      userId = existingUsers.users[0].id;
    } else {
      // Create the user
      const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            name: 'Super Admin',
            role: 'superadmin'
          }
        })
      });

      const newUser = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(newUser.message || 'Failed to create user');
      }

      userId = newUser.id;
    }

    // Update admin_profiles table with the user ID
    await fetch(`${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.pending-auth-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId
      })
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Superadmin user created successfully',
      credentials: {
        email: adminEmail,
        password: adminPassword
      },
      userId: userId
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
