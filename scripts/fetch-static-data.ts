import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OUTPUT_DIR = path.join(process.cwd(), "public", "data");

async function fetchAndSaveData() {
  console.log("🚀 Starting static data fetch...");
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const [
    contactInfo,
    projects,
    posts,
    testimonials,
    services,
    dailyRoutine,
    faq,
    resumeItems,
    aboutContent,
  ] = await Promise.all([
    fetchTable("contact_info"),
    fetchTable("projects"),
    fetchTable("posts", { status: "published" }),
    fetchTable("testimonials"),
    fetchTable("services"),
    fetchTable("daily_routine_items"),
    fetchTable("faq_items"),
    fetchTable("resume_items"),
    fetchContent(),
  ]);

  const dataToSave = [
    { filename: "sidebar.json", data: contactInfo?.[0] || null },
    { filename: "portfolio.json", data: projects || [] },
    { filename: "blog.json", data: posts || [] },
    {
      filename: "home.json",
      data: { testimonials, services, about_text: aboutContent },
    },
    { filename: "about.json", data: { daily_routine: dailyRoutine, faq } },
    { filename: "resume.json", data: resumeItems || [] },
  ];

  await Promise.all(
    dataToSave.map(async ({ filename, data }) => {
      await fs.writeFile(
        path.join(OUTPUT_DIR, filename),
        JSON.stringify(data, null, 2)
      );
      console.log(`✅ Saved: ${filename}`);
    })
  );

  await generateSitemap(posts || [], projects || []);

  console.log("\n✅ All static data saved successfully!");
}

async function fetchTable(table: string, filter?: any) {
  console.log(`📥 Fetching ${table}...`);
  let query = supabase.schema("app_portfolio").from(table).select("*");

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) console.error(`⚠️  Error fetching ${table}:`, error.message);
  return data;
}

async function fetchContent() {
  const { data } = await supabase
    .schema("app_portfolio")
    .from("content")
    .select("value")
    .eq("key", "about_text")
    .single();
  return data?.value || null;
}

async function generateSitemap(posts: any[], projects: any[]) {
  console.log("🗺️  Generating sitemap.xml...");

  const baseUrl = process.env.SITE_URL || "http://localhost:5173";

  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/sobre", priority: "0.9", changefreq: "weekly" },
    { path: "/curriculo", priority: "0.9", changefreq: "weekly" },
    { path: "/portfolio", priority: "0.9", changefreq: "weekly" },
    { path: "/blog", priority: "0.8", changefreq: "daily" },
  ];

  const postUrls =
    posts?.map(post => ({
      path: `/blog/${post.slug}`,
      priority: "0.7",
      changefreq: "monthly",
    })) || [];

  const projectUrls =
    projects?.map(project => ({
      path: `/portfolio#${project.id}`,
      priority: "0.6",
      changefreq: "monthly",
    })) || [];

  const allUrls = [...staticRoutes, ...postUrls, ...projectUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    url => `  <url>
    <loc>${baseUrl}${url.path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
  await fs.writeFile(sitemapPath, sitemap);
  console.log(`✅ Saved: sitemap.xml (${allUrls.length} URLs)`);
}

fetchAndSaveData()
  .then(() => {
    console.log("🎉 Build script completed!");
    process.exit(0);
  })
  .catch(err => {
    console.error("💥 Build script failed:", err);
    process.exit(1);
  });
