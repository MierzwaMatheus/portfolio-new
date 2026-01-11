import { supabase } from "@/lib/supabase";
import { BlogRepository, BlogPost } from "../interfaces/BlogRepository";

export class SupabaseBlogRepository implements BlogRepository {
  async list(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('posts')
      .select('id, title, subtitle, content, title_translations, subtitle_translations, content_translations, image, featured, status, created_at, published_at, tags, slug')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as BlogPost[];
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('posts')
      .select('id, title, subtitle, content, title_translations, subtitle_translations, content_translations, image, featured, status, created_at, published_at, tags, slug')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw error;
    }

    return data as BlogPost;
  }
}

