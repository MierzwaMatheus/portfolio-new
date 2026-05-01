import { ConvexHttpClient } from "convex/browser";
import {
  SidebarRepository,
  SidebarContactInfo,
} from "../interfaces/SidebarRepository";
import { mapSidebarContactInfo } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexSidebarRepository implements SidebarRepository {
  async getContactInfo(): Promise<SidebarContactInfo | null> {
    const data = await client.query(api.contactInfo.get, {});
    return data ? mapSidebarContactInfo(data) : null;
  }
}
