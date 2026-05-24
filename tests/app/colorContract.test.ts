import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

function readTemplate(rel: string) {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

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
