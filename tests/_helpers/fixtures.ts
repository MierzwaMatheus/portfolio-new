export const samplePtBrEnUs = {
  ptBR: "olá",
  enUS: "hello",
};

export const samplePostDoc = {
  _id: "post1",
  _creationTime: 1000,
  title: "Hello",
  subtitle: "World",
  content: "Body",
  image: "https://example.com/img.jpg",
  featured: true,
  status: "published",
  createdAt: 1700000000000,
  publishedAt: 1700000001000,
  tags: ["x", "y"],
  slug: "hello",
};

export const sampleProjectDoc = {
  _id: "project1",
  _creationTime: 2000,
  title: "Project Title",
  description: "Project Desc",
  longDescription: "Long",
  tags: ["a"],
  images: ["https://example.com/p.jpg"],
  demoLink: "https://demo",
  githubLink: "https://github",
  orderIndex: 0,
  slug: "project-title",
  caseStudy: "Case",
  titleTranslations: { ptBR: "Titulo", enUS: "Title" },
};

export const validRssPost = {
  id: "1",
  title: "First Post",
  subtitle: "Sub",
  slug: "first-post",
  image: "https://example.com/img.png",
  published_at: "2024-01-15T10:00:00.000Z",
  created_at: "2024-01-14T10:00:00.000Z",
  tags: ["tech"],
  content: "<p>Body</p>",
  content_translations: { "pt-BR": "<p>Corpo</p>" },
  title_translations: { "pt-BR": "Primeiro Post" },
  subtitle_translations: { "pt-BR": "Sub" },
};
