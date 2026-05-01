import { v } from 'convex/values';
import { action } from './_generated/server';

// Stripe integration stubs — replace with real Stripe SDK calls when ready

export const createProduct = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ productId: string }> => {
    // TODO: integrate Stripe SDK
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const product = await stripe.products.create({ name: args.name, description: args.description });
    // return { productId: product.id };
    console.log('[stripe stub] createProduct', args.name);
    return { productId: `prod_stub_${Date.now()}` };
  },
});

export const createPrice = action({
  args: {
    productId: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    recurring: v.optional(v.boolean()),
  },
  handler: async (_ctx, args): Promise<{ priceId: string }> => {
    // TODO: integrate Stripe SDK
    console.log('[stripe stub] createPrice', args.productId, args.amountCents);
    return { priceId: `price_stub_${Date.now()}` };
  },
});

export const createPaymentLink = action({
  args: {
    priceId: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ url: string; paymentLinkId: string }> => {
    // TODO: integrate Stripe SDK
    console.log('[stripe stub] createPaymentLink', args.priceId);
    return {
      paymentLinkId: `plink_stub_${Date.now()}`,
      url: `https://buy.stripe.com/stub/${Date.now()}`,
    };
  },
});

export const archivePrice = action({
  args: { priceId: v.string() },
  handler: async (_ctx, args): Promise<void> => {
    // TODO: integrate Stripe SDK
    console.log('[stripe stub] archivePrice', args.priceId);
  },
});

export const archiveProduct = action({
  args: { productId: v.string() },
  handler: async (_ctx, args): Promise<void> => {
    // TODO: integrate Stripe SDK
    console.log('[stripe stub] archiveProduct', args.productId);
  },
});
