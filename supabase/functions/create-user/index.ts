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

        const { email, password, role, name } = await req.json()

        if (!email || !password || !role) {
            return new Response(
                JSON.stringify({ error: 'Email, password and role are required' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            )
        }

        // 1. Create the user in Supabase Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        })

        if (userError) {
            throw userError
        }

        const userId = userData.user.id

        // 2. Assign the role in user_app_roles table
        // First, delete any existing rows for this user to avoid duplicates (e.g. from triggers)
        await supabaseAdmin
            .from('user_app_roles')
            .delete()
            .eq('user_id', userId)

        // Then insert the correct row
        const { error: roleError } = await supabaseAdmin
            .from('user_app_roles')
            .insert({
                user_id: userId,
                app_key: 'app_portfolio', // Correct app_key
                role: role // Correct role from request
            })

        if (roleError) {
            // If role assignment fails, we should probably delete the user to maintain consistency
            // or just return an error. For now, let's return an error.
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw roleError
        }

        return new Response(
            JSON.stringify({ user: userData.user, message: 'User created successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
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
