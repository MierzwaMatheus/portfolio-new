interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image: string;
  published_at: string;
  created_at: string;
  tags: string[];
  title_translations: Record<string, string>;
  subtitle_translations: Record<string, string>;
  content_translations: Record<string, string>;
}

interface RSSFeedConfig {
  siteUrl: string;
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
  language: string;
  rssUrl: string;
}

export class RSSFeedGenerator {
  private readonly config: RSSFeedConfig;

  constructor(config: RSSFeedConfig) {
    this.config = config;
  }

  generate(posts: BlogPost[]): string {
    const sortedPosts = [...posts].sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    const itemsXml = sortedPosts
      .map(post => this.generateItemXml(post))
      .join("\n    ");

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${this.escapeXml(this.config.siteTitle)}</title>
    <link>${this.encodeUrl(this.config.siteUrl)}</link>
    <description>${this.escapeXml(this.config.siteDescription)}</description>
    <language>${this.config.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${this.encodeUrl(this.config.rssUrl)}" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;
  }

  private generateItemXml(post: BlogPost): string {
    const title = this.escapeXml(
      post.title_translations["pt-BR"] || post.title
    );
    const rawContentHtml =
      post.content_translations["pt-BR"] ||
      post.content_translations["en-US"] ||
      "";
    const contentHtml = this.sanitizeHtml(rawContentHtml);
    const description = this.escapeXml(this.stripHtml(contentHtml));
    const link = this.encodeUrl(`${this.config.siteUrl}/blog/${post.slug}`);
    const pubDate = new Date(post.published_at).toUTCString();
    const guid = this.encodeUrl(`${this.config.siteUrl}/blog/${post.slug}`);
    const imageUrl = this.encodeUrl(post.image);
    const tags = post.tags
      .map(tag => `<category>${this.escapeXml(tag)}</category>`)
      .join("\n      ");

    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${guid}</guid>
      <description>${description}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${this.escapeXml(this.config.authorName)}</dc:creator>
      <media:content url="${imageUrl}" medium="image" />
      ${tags}
    </item>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private encodeUrl(url: string): string {
    try {
      return new URL(url).href;
    } catch {
      return url;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }

  private sanitizeHtml(html: string): string {
    let sanitized = html;
    sanitized = this.fixUnclosedPTags(sanitized);
    sanitized = this.fixNamedEntities(sanitized);
    return sanitized;
  }

  private fixUnclosedPTags(html: string): string {
    const openPTags = (html.match(/<p(?![^>]*\/>)/g) || []).length;
    const closePTags = (html.match(/<\/p>/g) || []).length;

    if (openPTags > closePTags) {
      const missingTags = openPTags - closePTags;
      return html + "</p>".repeat(missingTags);
    }

    return html;
  }

  private fixNamedEntities(html: string): string {
    const validEntities = [
      "amp",
      "lt",
      "gt",
      "quot",
      "apos",
      "nbsp",
      "copy",
      "reg",
      "trade",
      "mdash",
      "ndash",
      "lsquo",
      "rsquo",
      "ldquo",
      "rdquo",
      "hellip",
    ];

    return html.replace(
      /&(?!(?:#(?:x[a-fA-F0-9]+|[0-9]+)|[a-zA-Z]+);)/g,
      "&amp;"
    );
  }
}
