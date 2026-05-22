import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { rubricalConfig } from "../../rubrica.config";

export type SiteConfig = {
  site_title: string;
  site_description: string;
  site_url: string;
  site_name: string;
  og_image_url: string;
  twitter_handle: string;
  author_name: string;
  author_email: string;
  rss_title: string;
  rss_description: string;
  seo_home_title: string;
  seo_home_description: string;
  theme_accent_color: string;
  theme_accent_hsl: string;
  theme_font_sans: string;
  theme_font_mono: string;
  theme_radius: string;
  keywords: string[];
  lang: string;
};

function buildFallback(): SiteConfig {
  return {
    site_title: rubricalConfig.siteName,
    site_description: rubricalConfig.siteDescription,
    site_url: rubricalConfig.siteUrl,
    site_name: rubricalConfig.siteName,
    og_image_url: rubricalConfig.ogImageUrl,
    twitter_handle: rubricalConfig.twitterHandle,
    author_name: rubricalConfig.authorName,
    author_email: rubricalConfig.authorEmail,
    rss_title: rubricalConfig.rssTitle,
    rss_description: rubricalConfig.rssDescription,
    seo_home_title: rubricalConfig.seoHomeTitle,
    seo_home_description: rubricalConfig.seoHomeDescription,
    theme_accent_color: rubricalConfig.accentColor,
    theme_accent_hsl: "",
    theme_font_sans: rubricalConfig.fontSans,
    theme_font_mono: rubricalConfig.fontMono,
    theme_radius: rubricalConfig.radius,
    keywords: [],
    lang: rubricalConfig.lang,
  };
}

export function useSiteConfig(): SiteConfig & { isLoading: boolean } {
  const data = useQuery(api.siteConfig.getPublic);
  const fallback = buildFallback();

  if (data === undefined) {
    return { ...fallback, isLoading: true };
  }

  const convexMap = Object.fromEntries(data.map((d) => [d.key, d.value]));
  return { ...fallback, ...convexMap, isLoading: false };
}
