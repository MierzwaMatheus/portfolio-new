import { createClient } from '@supabase/supabase-js';

export default async function handler(req: Request) {
  const isCron = req.headers.get('x-vercel-cron') === 'true';
  if (!isCron) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: status } = await supabase
    .schema('app_portfolio')
    .from('deploy_status')
    .select('pending_changes, last_published_at')
    .single();

  if (!status || !status.pending_changes) {
    return new Response(JSON.stringify({ message: 'No pending changes' }), { status: 200 });
  }

  const lastPublished = new Date(status.last_published_at);
  const now = new Date();
  const minutesSincePublish = (now.getTime() - lastPublished.getTime()) / 1000 / 60;

  if (minutesSincePublish < 10) {
    return new Response(JSON.stringify({ message: 'Throttled' }), { status: 200 });
  }

  const vercelApiToken = process.env.VERCEL_API_TOKEN!;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID!;

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
    return new Response(JSON.stringify({ error: 'Deploy failed' }), { status: 500 });
  }

  const deployData = await vercelResponse.json();

  await supabase
    .schema('app_portfolio')
    .from('deploy_status')
    .update({
      pending_changes: false,
      last_published_at: now.toISOString(),
    })
    .eq('id', '00000000-0000-0000-0000-000000000001');

  return new Response(JSON.stringify({ message: 'Deploy triggered', deploymentId: deployData.id }), { status: 200 });
}
