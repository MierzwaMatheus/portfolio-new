import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData } = await supabase
    .from("user_app_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["root", "admin"])
    .single();

  if (!userData) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseApp = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: "app_portfolio" },
  });

  const { data: status } = await supabaseApp
    .from("deploy_status")
    .select("pending_changes, last_published_at")
    .single();

  if (!status) {
    return new Response(
      JSON.stringify({ error: "Failed to check deploy status" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const lastPublished = new Date(status.last_published_at);
  const now = new Date();
  const minutesSincePublish =
    (now.getTime() - lastPublished.getTime()) / 1000 / 60;

  if (minutesSincePublish < 10) {
    return new Response(
      JSON.stringify({
        message: "Throttled - last deploy too recent",
        skipped: true,
        minutesSince: Math.floor(minutesSincePublish),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!status.pending_changes) {
    return new Response(
      JSON.stringify({
        message: "No pending changes to publish",
        skipped: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const vercelDeployHookUrl = Deno.env.get("VERCEL_DEPLOY_HOOK_URL");

  try {
    const vercelResponse = await fetch(vercelDeployHookUrl!, {
      method: "POST",
    });

    if (!vercelResponse.ok) {
      const vercelError = await vercelResponse.text();
      console.error("Vercel API error:", vercelError);

      return new Response(
        JSON.stringify({
          error: "Failed to trigger Vercel deploy",
          details: vercelError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const vercelData = await vercelResponse.json().catch(() => ({}));

    await supabaseApp
      .from("deploy_status")
      .update({
        pending_changes: false,
        last_published_at: now.toISOString(),
        last_check_at: now.toISOString(),
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");

    return new Response(
      JSON.stringify({
        message: "Deploy triggered successfully",
        triggeredAt: now.toISOString(),
        triggeredBy: user.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error triggering deploy:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
