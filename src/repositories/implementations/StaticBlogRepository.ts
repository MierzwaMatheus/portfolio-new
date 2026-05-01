import { BlogRepository, BlogPost } from "../interfaces/BlogRepository";
import { mapBlogPost } from "../mappers/convexMappers";

export class StaticBlogRepository implements BlogRepository {
  async list(): Promise<BlogPost[]> {
    try {
      const response = await fetch("/data/blog.json");
      if (!response.ok) return [];
      const raw = await response.json();
      const posts: BlogPost[] = Array.isArray(raw) ? raw.map(mapBlogPost) : [];
      return posts.sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );
    } catch (error) {
      console.error("Error loading static blog data:", error);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const safeSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      const response = await fetch(`/data/posts/${safeSlug}.json`);
      if (response.ok) {
        const raw = await response.json();
        return mapBlogPost(raw);
      }
    } catch (error) {
      // fall through to list-based lookup
    }
    const posts = await this.list();
    return posts.find((post) => post.slug === slug) || null;
  }
}
