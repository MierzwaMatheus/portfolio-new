import { ConvexHttpClient } from "convex/browser";
import {
  PortfolioRepository,
  Project,
} from "../interfaces/PortfolioRepository";
import { mapProject } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexPortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    const data = await client.query(api.projects.list, {});
    return Array.isArray(data) ? data.map(mapProject) : [];
  }
}
