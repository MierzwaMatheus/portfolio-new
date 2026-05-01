import { ConvexHttpClient } from "convex/browser";
import { BlogRepository, BlogPost } from "../interfaces/BlogRepository";
import { mapBlogPost } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexBlogRepository implements BlogRepository {
  async list(): Promise<BlogPost[]> {
    const data = await client.query(api.posts.listAllPublished, {});
    const posts: BlogPost[] = Array.isArray(data) ? data.map(mapBlogPost) : [];
    return posts.sort(
      (a, b) =>
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime()
    );
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const data = await client.query(api.posts.getBySlug, { slug });
    return data ? mapBlogPost(data) : null;
  }
}
