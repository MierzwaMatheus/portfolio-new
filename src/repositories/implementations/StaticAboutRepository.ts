import {
  AboutRepository,
  DailyRoutineItem,
  FAQItem,
} from "../interfaces/AboutRepository";

export class StaticAboutRepository implements AboutRepository {
  async getDailyRoutineItems(): Promise<DailyRoutineItem[]> {
    try {
      const response = await fetch("/data/about.json");
      if (!response.ok) return [];
      const data = await response.json();
      return data.daily_routine || [];
    } catch (error) {
      console.error("Error loading static about data:", error);
      return [];
    }
  }

  async getFAQItems(): Promise<FAQItem[]> {
    try {
      const response = await fetch("/data/about.json");
      if (!response.ok) return [];
      const data = await response.json();
      return data.faq || [];
    } catch (error) {
      console.error("Error loading static about data:", error);
      return [];
    }
  }
}
