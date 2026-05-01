import {
  PortfolioRepository,
  Project,
} from "../interfaces/PortfolioRepository";
import { mapProject } from "../mappers/convexMappers";

export class StaticPortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    try {
      const response = await fetch("/data/portfolio.json");
      if (!response.ok) return [];
      const raw = await response.json();
      return Array.isArray(raw) ? raw.map(mapProject) : [];
    } catch (error) {
      console.error("Error loading static portfolio data:", error);
      return [];
    }
  }
}
