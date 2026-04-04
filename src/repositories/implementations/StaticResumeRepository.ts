import { ResumeRepository, ResumeItem } from "../interfaces/ResumeRepository";

export class StaticResumeRepository implements ResumeRepository {
  async list(): Promise<ResumeItem[]> {
    try {
      const response = await fetch("/data/resume.json");
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Error loading static resume data:", error);
      return [];
    }
  }
}
