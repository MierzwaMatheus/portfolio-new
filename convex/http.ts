import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { handleImport } from './importCsv';
import { auth } from './auth';
import { aiProxy } from './playgroundAi';

const http = httpRouter();

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) result |= aBytes[i] ^ bBytes[i];
  return result === 0;
}

// Verify Stripe webhook signature (HMAC-SHA256)
async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  try {
    const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    // Reject replays older than 5 minutes
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(computed, v1);
  } catch {
    return false;
  }
}

// Required by @convex-dev/auth — exposes /.well-known/openid-configuration etc.
auth.addHttpRoutes(http);

// CSV import endpoints — POST /import/<table>
for (const table of ['projects', 'posts', 'services', 'faq', 'contact_info', 'testimonials', 'resume_items', 'daily_routine'] as const) {
  http.route({
    path: `/import/${table}`,
    method: 'POST',
    handler: httpAction(async (ctx, req) => handleImport(ctx, req, table)),
  });
}

// Image migration endpoints
http.route({
  path: '/import/image-folders',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.IMPORT_SECRET;
    if (!secret) return new Response('IMPORT_SECRET not set', { status: 500 });
    if (!timingSafeEqual(req.headers.get('x-import-secret') ?? '', secret)) return new Response('Unauthorized', { status: 401 });
    const rows = await req.json() as unknown[];
    const idMap = await ctx.runMutation(internal.importCsv._bulkInsertImageFolders, { rows });
    return new Response(JSON.stringify({ ok: true, idMap }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),
});

http.route({
  path: '/import/upload-image',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.IMPORT_SECRET;
    if (!secret) return new Response('IMPORT_SECRET not set', { status: 500 });
    if (!timingSafeEqual(req.headers.get('x-import-secret') ?? '', secret)) return new Response('Unauthorized', { status: 401 });

    const displayName = req.headers.get('x-display-name') ?? 'image';
    const folderId = req.headers.get('x-folder-id') ?? undefined;
    const fileSize = req.headers.get('x-file-size') ? Number(req.headers.get('x-file-size')) : undefined;
    const mimeType = req.headers.get('x-mime-type') ?? 'application/octet-stream';
    const supabaseId = req.headers.get('x-supabase-id') ?? undefined;

    const uploadUrl = await ctx.storage.generateUploadUrl();
    const blob = await req.blob();
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });
    if (!uploadResp.ok) {
      return new Response(`Upload failed: ${uploadResp.statusText}`, { status: 500 });
    }
    const { storageId } = await uploadResp.json() as { storageId: string };

    const imageMetadataId = await ctx.runMutation(internal.importCsv._createImageMetadata, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storageId: storageId as any,
      displayName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      folderId: folderId as any,
      fileSize,
      mimeType,
      supabaseId,
    });

    return new Response(JSON.stringify({ ok: true, storageId, imageMetadataId, supabaseId }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),
});

http.route({
  path: '/import/link-images',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.IMPORT_SECRET;
    if (!secret) return new Response('IMPORT_SECRET not set', { status: 500 });
    if (!timingSafeEqual(req.headers.get('x-import-secret') ?? '', secret)) return new Response('Unauthorized', { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await req.json() as any;
    const linked = await ctx.runMutation(internal.importCsv._linkImages, body);
    return new Response(JSON.stringify({ ok: true, linked }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }),
});

http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('STRIPE_WEBHOOK_SECRET not configured', { status: 500 });
    }

    const body = await req.text();

    // Verify Stripe webhook signature using HMAC-SHA256
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data.object;
      const externalRef = session['metadata'] as Record<string, string> | undefined;
      const checkoutUniqueLink = externalRef?.['uniqueLink'];

      if (checkoutUniqueLink) {
        await ctx.runMutation(internal.checkouts.markPaidByLink, {
          uniqueLink: checkoutUniqueLink,
          gatewayData: JSON.stringify(session),
        });
      }
    }

    return new Response('ok', { status: 200 });
  }),
});

http.route({
  path: '/webhooks/asaas',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const asaasToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (asaasToken) {
      const receivedToken = req.headers.get('asaas-access-token');
      if (!timingSafeEqual(receivedToken ?? '', asaasToken)) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body = await req.text();

    let event: { event: string; payment?: Record<string, unknown> };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment;
      const externalRef = payment?.['externalReference'] as string | undefined;

      if (externalRef) {
        await ctx.runMutation(internal.checkouts.markPaidByLink, {
          uniqueLink: externalRef,
          asaasChargeId: payment?.['id'] as string | undefined,
          gatewayData: JSON.stringify(payment),
        });
      }
    }

    return new Response('ok', { status: 200 });
  }),
});

http.route({
  path: '/webhooks/vercel-deploy',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.VERCEL_WEBHOOK_SECRET;

    if (expectedSecret && !timingSafeEqual(secret ?? '', expectedSecret)) {
      return new Response('Unauthorized', { status: 401 });
    }

    await ctx.runMutation(internal.publishStatus.setPublished, {});

    return new Response('ok', { status: 200 });
  }),
});

http.route({ path: '/playground/ai-proxy', method: 'POST', handler: aiProxy });
http.route({ path: '/playground/ai-proxy', method: 'OPTIONS', handler: aiProxy });

export default http;
