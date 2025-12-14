import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Handle GET request to list users
        if (req.method === 'GET') {
            // 1. Get all users from Auth
            const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

            if (authError) throw authError

            // 2. Get all roles for this app
            const { data: roles, error: rolesError } = await supabaseAdmin
                .from('user_app_roles')
                .select('*')
                .eq('app_key', 'app_portfolio')

            if (rolesError) throw rolesError

            // 3. Combine data
            // Filter users who have a role in this app
            const appUsers = users
                .filter(user => roles.some(role => role.user_id === user.id))
                .map(user => {
                    const userRole = roles.find(role => role.user_id === user.id)
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name || 'N/A',
                        role: userRole?.role || 'user',
                        created_at: userRole?.created_at || user.created_at
                    }
                })

            return new Response(
                JSON.stringify({ users: appUsers }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // Handle POST request to create/add user
        if (req.method === 'POST') {
            const { email, password, role, name } = await req.json()

            if (!email || !role) {
                return new Response(
                    JSON.stringify({ error: 'Email and role are required' }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    }
                )
            }

            // 1. Check if user exists
            const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = users.find(u => u.email === email)

            let userId = existingUser?.id

            if (existingUser) {
                // User exists, just add/update role
                console.log(`User ${email} exists, adding role...`)

                const { error: roleError } = await supabaseAdmin
                    .from('user_app_roles')
                    .upsert({
                        user_id: userId,
                        app_key: 'app_portfolio',
                        role: role
                    }, { onConflict: 'user_id, app_key' })

                if (roleError) throw roleError

                return new Response(
                    JSON.stringify({ message: 'User added to application successfully' }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    }
                )
            } else {
                // User does not exist, create new
                if (!password) {
                    return new Response(
                        JSON.stringify({ error: 'Password is required for new users' }),
                        {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                            status: 400,
                        }
                    )
                }

                console.log(`Creating new user ${email}...`)

                // Pass app_key and role in metadata so the trigger handles the insert
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                        name,
                        app_key: 'app_portfolio',
                        role: role
                    }
                })

                if (userError) throw userError

                return new Response(
                    JSON.stringify({ user: userData.user, message: 'User created successfully' }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    }
                )
            }
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 405,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
