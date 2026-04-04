import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { data: userData } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['root', 'admin'])
    .single();

  if (!userData) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const { data: status } = await supabase
    .schema('app_portfolio')
    .from('deploy_status')
    .select('pending_changes, last_published_at')
    .single();

  if (!status) {
    return new Response(JSON.stringify({ error: 'Failed to check deploy status' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const lastPublished = new Date(status.last_published_at);
  const now = new Date();
  const minutesSincePublish = (now.getTime() - lastPublished.getTime()) / 1000 / 60;

  if (minutesSincePublish < 10) {
    return new Response(JSON.stringify({ message: 'Throttled', skipped: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (!status.pending_changes) {
    return new Response(JSON.stringify({ message: 'No pending changes', skipped: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const vercelApiToken = Deno.env.get('VERCEL_API_TOKEN')!;
  const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID')!;

  const vercelResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: vercelProjectId,
      branch: 'main',
      target: 'production',
    })
  });

  if (!vercelResponse.ok) {
    return new Response(JSON.stringify({ error: 'Failed to trigger deploy' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const vercelData = await vercelResponse.json();

  await supabase
    .schema('app_portfolio')
    .from('deploy_status')
    .update({
      pending_changes: false,
      last_published_at: now.toISOString(),
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  return new Response(JSON.stringify({
    message: 'Deploy triggered successfully',
    deploymentId: vercelData.id,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
