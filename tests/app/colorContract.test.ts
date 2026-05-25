import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

function readTemplate(rel: string) {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

// ---- Ciclo 3: templates sem padrões de cor proibidos --------------------------------

const TEMPLATE_FILES = [
  "templates/layouts/bento/Layout.tsx",
  "templates/layouts/bento/FloatingDock.tsx",
  "templates/layouts/bento/pages/Home.tsx",
  "templates/layouts/bento/pages/About.tsx",
  "templates/layouts/bento/pages/Blog.tsx",
  "templates/layouts/bento/pages/Portfolio.tsx",
  "templates/layouts/bento/pages/Resume.tsx",
  "templates/layouts/magazine/Layout.tsx",
  "templates/layouts/magazine/Masthead.tsx",
  "templates/layouts/magazine/pages/Home.tsx",
  "templates/layouts/magazine/pages/Resume.tsx",
  "templates/layouts/magazine/pages/About.tsx",
  "templates/layouts/magazine/pages/Portfolio.tsx",
  "templates/layouts/magazine/pages/Blog.tsx",
  "templates/layouts/brutalist/Layout.tsx",
  "templates/layouts/brutalist/Navbar.tsx",
  "templates/layouts/cyberpunk/Layout.tsx",
  "templates/layouts/cyberpunk/Sidebar.tsx",
  "templates/layouts/swiss/Layout.tsx",
  "templates/layouts/swiss/Sidebar.tsx",
  "templates/layouts/swiss/SwissShared.tsx",
];

const FORBIDDEN_PATTERNS: Array<[string, RegExp]> = [
  ["--background", /--background\b/],
  ["--foreground", /--foreground\b/],
  ["--muted", /--muted\b/],
  ["--card", /--card\b/],
  ["--border", /--border\b/],
  ["--primary-foreground", /--primary-foreground\b/],
  ["--accent-foreground", /--accent-foreground\b/],
  ["--neon-purple", /neon-purple/],
  ["--neon-lime", /neon-lime/],
  ["bg-background", /bg-background\b/],
  ["text-foreground", /text-foreground\b/],
  ["text-white hardcoded", /\btext-white\b/],
  ["text-gray hardcoded", /\btext-gray-\d+\b/],
  ["bg-white/ hardcoded", /\bbg-white\/\d/],
  ["border-white/ hardcoded", /\bborder-white\/\d/],
  ["--bento-card", /--bento-card\b/],
  ["--bento-border", /--bento-border\b/],
  ["--bento-dock", /--bento-dock\b/],
  ["--bento-font", /--bento-font\b/],
  ["--swiss-font", /--swiss-font\b/],
  ["--mag-body", /--mag-body\b/],
  ["--mag-display", /--mag-display\b/],
  ["--mag-mono", /--mag-mono\b/],
];

describe("colorContract — templates", () => {
  for (const file of TEMPLATE_FILES) {
    describe(file, () => {
      const content = readTemplate(file);
      for (const [label, pattern] of FORBIDDEN_PATTERNS) {
        it(`não usa "${label}"`, () => {
          expect(content, `${file} contém padrão proibido "${label}"`).not.toMatch(pattern);
        });
      }
    });
  }
});

// ---- Ciclo 2: tokens Tailwind renomeados -----------------------------------------

describe("colorContract — tokens Tailwind", () => {
  it("src/index.css não referencia neon-purple como token de cor", () => {
    const css = readTemplate("src/index.css");
    expect(css).not.toMatch(/--color-neon-purple/);
  });

  it("src/index.css não referencia neon-lime como token de cor", () => {
    const css = readTemplate("src/index.css");
    expect(css).not.toMatch(/--color-neon-lime/);
  });

  it("src/index.css expõe --color-primary mapeado para var(--primary)", () => {
    const css = readTemplate("src/index.css");
    expect(css).toMatch(/--color-primary:\s*var\(--primary\)/);
  });

  it("src/index.css expõe --color-accent mapeado para var(--accent)", () => {
    const css = readTemplate("src/index.css");
    expect(css).toMatch(/--color-accent:\s*var\(--accent\)/);
  });

  it("src/index.css não usa from-neon-purple nem to-neon-lime em gradientes", () => {
    const css = readTemplate("src/index.css");
    expect(css).not.toMatch(/neon-purple|neon-lime/);
  });
});
