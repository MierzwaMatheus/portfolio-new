import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { CheckoutApi } from "./CheckoutApi";
import type {
  Checkout,
  CreateCheckoutInput,
  UpdateCheckoutInput,
} from "@/types/checkout";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexCheckoutApi implements CheckoutApi {
  async createCheckout(input: CreateCheckoutInput): Promise<Checkout> {
    const id = await client.mutation(api.checkouts.create, input as any);
    const data = await client.query(api.checkouts.getByLink, {
      uniqueLink: (input as any).uniqueLink,
    });
    return (data ?? { _id: id }) as unknown as Checkout;
  }

  async getCheckout(uniqueLink: string): Promise<Checkout | null> {
    const data = await client.query(api.checkouts.getByLink, { uniqueLink });
    return (data as unknown as Checkout) ?? null;
  }

  async updateCheckout(
    id: string,
    input: UpdateCheckoutInput
  ): Promise<Checkout> {
    await client.mutation(api.checkouts.updatePayment, {
      id: id as any,
      ...(input as any),
    });
    return { _id: id, ...input } as unknown as Checkout;
  }

  async listCheckouts(
    limit: number = 100,
    status?: string
  ): Promise<Checkout[]> {
    const data = await client.query(api.checkouts.listAdmin, {
      limit,
      status: status as any,
    });
    return (data as unknown as Checkout[]) ?? [];
  }
}
