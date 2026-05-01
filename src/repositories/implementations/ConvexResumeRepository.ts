import { ConvexHttpClient } from "convex/browser";
import { ResumeRepository, ResumeItem } from "../interfaces/ResumeRepository";
import { mapResumeItem } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexResumeRepository implements ResumeRepository {
  async list(): Promise<ResumeItem[]> {
    const data = await client.query(api.resumeItems.listAll, {});
    return Array.isArray(data) ? data.map(mapResumeItem) : [];
  }
}
