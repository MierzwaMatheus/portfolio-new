import { supabase } from "@/lib/supabase";
import { AboutRepository, DailyRoutineItem, FAQItem } from "../interfaces/AboutRepository";

export class SupabaseAboutRepository implements AboutRepository {
  async getDailyRoutineItems(): Promise<DailyRoutineItem[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('daily_routine_items')
      .select('id, image_url, tags, description, description_translations, span_size, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      console.error("Error fetching daily routine:", error);
      return [];
    }

    return (data || []) as DailyRoutineItem[];
  }

  async getFAQItems(): Promise<FAQItem[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('faq_items')
      .select('id, question, question_translations, answer, answer_translations, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      console.error("Error fetching FAQ:", error);
      return [];
    }

    return (data || []) as FAQItem[];
  }
}

