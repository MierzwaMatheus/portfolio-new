import { supabase } from "@/lib/supabase";
import { PortfolioRepository, Project } from "../interfaces/PortfolioRepository";

export class SupabasePortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('projects')
      .select('id, title, description, long_description, title_translations, description_translations, long_description_translations, tags, images, demo_link, github_link, order_index')
      .order('order_index', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []) as Project[];
  }
}

