import { BlogRepository, BlogPost } from "../interfaces/BlogRepository";

export class StaticBlogRepository implements BlogRepository {
  async list(): Promise<BlogPost[]> {
    try {
      const response = await fetch("/data/blog.json");
      if (!response.ok) return [];
      const posts = await response.json();

      return posts.sort(
        (a: BlogPost, b: BlogPost) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );
    } catch (error) {
      console.error("Error loading static blog data:", error);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const posts = await this.list();
    return posts.find(post => post.slug === slug) || null;
  }
}
