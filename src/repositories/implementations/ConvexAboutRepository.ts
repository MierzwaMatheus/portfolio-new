import { ConvexHttpClient } from "convex/browser";
import {
  AboutRepository,
  DailyRoutineItem,
  FAQItem,
} from "../interfaces/AboutRepository";
import { mapDailyRoutineItem, mapFAQItem } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexAboutRepository implements AboutRepository {
  async getDailyRoutineItems(): Promise<DailyRoutineItem[]> {
    const data = await client.query(api.aboutDailyRoutine.list, {});
    return Array.isArray(data) ? data.map(mapDailyRoutineItem) : [];
  }

  async getFAQItems(): Promise<FAQItem[]> {
    const data = await client.query(api.aboutFaq.list, {});
    return Array.isArray(data) ? data.map(mapFAQItem) : [];
  }
}
