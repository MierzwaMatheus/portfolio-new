import {
  PortfolioRepository,
  Project,
} from "../interfaces/PortfolioRepository";

export class StaticPortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    try {
      const response = await fetch("/data/portfolio.json");
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Error loading static portfolio data:", error);
      return [];
    }
  }
}
