import {
  AboutRepository,
  DailyRoutineItem,
  FAQItem,
} from "../interfaces/AboutRepository";
import { mapDailyRoutineItem, mapFAQItem } from "../mappers/convexMappers";

export class StaticAboutRepository implements AboutRepository {
  async getDailyRoutineItems(): Promise<DailyRoutineItem[]> {
    try {
      const response = await fetch("/data/about.json");
      if (!response.ok) return [];
      const data = await response.json();
      const list = Array.isArray(data?.dailyRoutine)
        ? data.dailyRoutine
        : Array.isArray(data?.daily_routine)
        ? data.daily_routine
        : [];
      return list.map(mapDailyRoutineItem);
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
      const list = Array.isArray(data?.faq) ? data.faq : [];
      return list.map(mapFAQItem);
    } catch (error) {
      console.error("Error loading static about data:", error);
      return [];
    }
  }
}
