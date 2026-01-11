import { supabase } from "@/lib/supabase";
import { ResumeRepository, ResumeItem } from "../interfaces/ResumeRepository";

export class SupabaseResumeRepository implements ResumeRepository {
  async list(): Promise<ResumeItem[]> {
    const { data, error } = await supabase
      .schema("app_portfolio")
      .from("resume_items")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching resume items:", error);
      return [];
    }

    return (data || []) as ResumeItem[];
  }
}

