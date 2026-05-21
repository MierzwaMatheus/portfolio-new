import { v } from "convex/values";
import { query } from "./_generated/server";

export const PUBLIC_KEYS = [
  "site_title",
  "site_description",
  "site_url",
  "site_name",
  "og_image_url",
  "twitter_handle",
  "author_name",
  "author_email",
  "rss_title",
  "rss_description",
  "seo_home_title",
  "seo_home_description",
  "theme_accent_color",
  "theme_accent_hsl",
  "theme_font_sans",
  "theme_font_mono",
  "theme_radius",
  "keywords",
  "lang",
] as const;

export const INTERNAL_KEYS = [
  "og_image_storage_id",
] as const;

export type PublicKey = (typeof PUBLIC_KEYS)[number];
export type InternalKey = (typeof INTERNAL_KEYS)[number];

function isInternalKey(key: string): boolean {
  return (INTERNAL_KEYS as readonly string[]).includes(key);
}

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("siteConfig").collect();
    return all.filter((doc) => !isInternalKey(doc.key));
  },
});
