import { ResumeRepository, ResumeItem } from "../interfaces/ResumeRepository";
import { mapResumeItem } from "../mappers/convexMappers";

export class StaticResumeRepository implements ResumeRepository {
  async list(): Promise<ResumeItem[]> {
    try {
      const response = await fetch("/data/resume.json");
      if (!response.ok) return [];
      const raw = await response.json();
      return Array.isArray(raw) ? raw.map(mapResumeItem) : [];
    } catch (error) {
      console.error("Error loading static resume data:", error);
      return [];
    }
  }
}
