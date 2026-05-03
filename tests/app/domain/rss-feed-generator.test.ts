import { describe, it, expect } from "vitest";
import { RSSFeedGenerator } from "../../../domain/use-cases/rss-feed-generator";

const config = {
  siteUrl: "https://example.com",
  siteTitle: "My Site",
  siteDescription: "A blog & more",
  authorName: "Jane",
  authorEmail: "jane@example.com",
  language: "pt-BR",
  rssUrl: "https://example.com/rss.xml",
  copyright: "© 2024 Jane",
};

const post = (overrides: any = {}) => ({
  id: "1",
  title: "Default Title",
  subtitle: "Sub",
  slug: "default",
  image: "https://example.com/img.png",
  published_at: "2024-01-01T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  tags: ["a"],
  content: "<p>Body</p>",
  content_translations: { "pt-BR": "<p>Corpo</p>" },
  title_translations: { "pt-BR": "Título Default" },
  subtitle_translations: { "pt-BR": "Sub" },
  ...overrides,
});

describe("RSSFeedGenerator", () => {
  const gen = new RSSFeedGenerator(config);

  it("renders RSS 2.0 envelope with required namespaces", () => {
    const xml = gen.generate([]);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8" \?>/);
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xml).toContain(
      'xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    );
    expect(xml).toContain('xmlns:media="http://search.yahoo.com/mrss/"');
  });

  it("includes copyright when configured, omits when not", () => {
    const xml = gen.generate([]);
    expect(xml).toContain("<copyright>© 2024 Jane</copyright>");

    const noCopy = new RSSFeedGenerator({ ...config, copyright: undefined });
    expect(noCopy.generate([])).not.toContain("<copyright>");
  });

  it("escapes XML special chars in title, description, tags", () => {
    const xml = new RSSFeedGenerator({
      ...config,
      siteTitle: 'Title & <b>"X"</b>',
      siteDescription: "A & B",
    }).generate([
      post({
        title: "T < & >",
        title_translations: { "pt-BR": "T < & >" },
        tags: ["t&t", "<x>"],
      }),
    ]);
    expect(xml).toContain("Title &amp; &lt;b&gt;&quot;X&quot;&lt;/b&gt;");
    expect(xml).toContain("A &amp; B");
    expect(xml).toContain("<title>T &lt; &amp; &gt;</title>");
    expect(xml).toContain("<category>t&amp;t</category>");
    expect(xml).toContain("<category>&lt;x&gt;</category>");
  });

  it("sorts posts by published_at DESC", () => {
    const xml = gen.generate([
      post({ slug: "old", published_at: "2024-01-01T00:00:00Z", title: "Old", title_translations: { "pt-BR": "Old" } }),
      post({ slug: "new", published_at: "2024-12-31T00:00:00Z", title: "New", title_translations: { "pt-BR": "New" } }),
      post({ slug: "mid", published_at: "2024-06-15T00:00:00Z", title: "Mid", title_translations: { "pt-BR": "Mid" } }),
    ]);
    const indices = ["New", "Mid", "Old"].map((t) => xml.indexOf(`<title>${t}</title>`));
    expect(indices[0]).toBeGreaterThan(0);
    expect(indices[0]).toBeLessThan(indices[1]);
    expect(indices[1]).toBeLessThan(indices[2]);
  });

  it("prefers pt-BR title_translations over default title", () => {
    const xml = gen.generate([
      post({
        title: "Default",
        title_translations: { "pt-BR": "Pré-traduzido" },
      }),
    ]);
    expect(xml).toContain("<title>Pré-traduzido</title>");
  });

  it("uses default title when title_translations missing pt-BR", () => {
    const xml = gen.generate([
      post({ title: "Default", title_translations: { "en-US": "EN only" } }),
    ]);
    expect(xml).toContain("<title>Default</title>");
  });

  it("content fallback chain: pt-BR → en-US → content", () => {
    const xml1 = gen.generate([
      post({
        content: "X",
        content_translations: { "pt-BR": "PT", "en-US": "EN" },
      }),
    ]);
    expect(xml1).toContain("<![CDATA[PT]]>");

    const xml2 = gen.generate([
      post({
        content: "X",
        content_translations: { "en-US": "EN" },
      }),
    ]);
    expect(xml2).toContain("<![CDATA[EN]]>");

    const xml3 = gen.generate([
      post({ content: "X", content_translations: {} }),
    ]);
    expect(xml3).toContain("<![CDATA[X]]>");
  });

  it("description strips HTML tags from content", () => {
    const xml = gen.generate([
      post({
        content: "<p>Hello <strong>world</strong>!</p>",
        content_translations: {},
      }),
    ]);
    expect(xml).toMatch(/<description>Hello world!<\/description>/);
  });

  it("encodes invalid URLs by passing through, valid URLs are normalized", () => {
    const xml = gen.generate([
      post({ image: "not a url" }),
    ]);
    expect(xml).toContain('media:content url="not a url"');

    const xml2 = gen.generate([
      post({ image: "https://example.com/A B.png" }),
    ]);
    // URL constructor encodes spaces to %20
    expect(xml2).toContain("https://example.com/A%20B.png");
  });

  it("appends missing </p> tags when count mismatched", () => {
    const xml = gen.generate([
      post({
        content: "<p>One<p>Two<p>Three</p>",
        content_translations: {},
      }),
    ]);
    // 3 opens, 1 close → adds 2 closes
    const matches = xml.match(/<\/p>/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("does not add </p> when already balanced", () => {
    const xml = gen.generate([
      post({
        content: "<p>One</p><p>Two</p>",
        content_translations: {},
      }),
    ]);
    const matches = xml.match(/<\/p>/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it("converts bare ampersands in content to &amp;", () => {
    const xml = gen.generate([
      post({
        content: "X & Y",
        content_translations: {},
      }),
    ]);
    expect(xml).toContain("X &amp; Y");
  });

  it("preserves valid numeric/named entities inside CDATA content:encoded", () => {
    const xml = gen.generate([
      post({
        content: "Copy &copy; &#123; &amp; ok",
        content_translations: {},
      }),
    ]);
    const cdataMatch = xml.match(/<!\[CDATA\[(.*?)\]\]>/s);
    expect(cdataMatch).not.toBeNull();
    expect(cdataMatch![1]).toContain("&copy;");
    expect(cdataMatch![1]).toContain("&#123;");
    expect(cdataMatch![1]).toContain("&amp;");
    expect(cdataMatch![1]).not.toContain("&amp;copy;");
    expect(cdataMatch![1]).not.toContain("&amp;amp;");
  });

  it("includes a media:content tag with the post image URL", () => {
    const xml = gen.generate([
      post({ image: "https://cdn.example.com/img.png" }),
    ]);
    expect(xml).toContain(
      'media:content url="https://cdn.example.com/img.png" medium="image"',
    );
  });

  it("includes link and guid built from siteUrl + /blog/ + slug", () => {
    const xml = gen.generate([post({ slug: "my-post" })]);
    expect(xml).toContain("<link>https://example.com/blog/my-post</link>");
    expect(xml).toContain(
      '<guid isPermaLink="true">https://example.com/blog/my-post</guid>',
    );
  });

  it("renders dc:creator with the author name", () => {
    const xml = gen.generate([post()]);
    expect(xml).toContain("<dc:creator>Jane</dc:creator>");
  });

  it("renders pubDate as RFC 2822 (toUTCString format)", () => {
    const xml = gen.generate([post({ published_at: "2024-01-15T10:00:00.000Z" })]);
    expect(xml).toMatch(/<pubDate>Mon, 15 Jan 2024 10:00:00 GMT<\/pubDate>/);
  });

  it("renders one <item> per post", () => {
    const xml = gen.generate([post({ slug: "a" }), post({ slug: "b" })]);
    const matches = xml.match(/<item>/g) ?? [];
    expect(matches.length).toBe(2);
  });
});
