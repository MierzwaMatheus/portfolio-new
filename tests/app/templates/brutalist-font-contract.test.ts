import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const root = resolve(__dirname, "../../..");

describe("brutalist template — contrato de fonte CSS", () => {
  const pages = ["Home", "About", "Resume", "Blog", "Portfolio"];

  pages.forEach((page) => {
    it(`${page}.tsx não usa --brut-mono`, () => {
      const src = readFileSync(
        resolve(root, `templates/layouts/brutalist/pages/${page}.tsx`),
        "utf8"
      );
      expect(src).not.toContain("--brut-mono");
    });
  });
});

describe("brutalist Home — banner dinâmico", () => {
  it("Home.tsx não contém MATHEUS hardcoded", () => {
    const src = readFileSync(
      resolve(root, "templates/layouts/brutalist/pages/Home.tsx"),
      "utf8"
    );
    expect(src).not.toContain("MATHEUS");
  });

  it("Home.tsx usa contactName do hook", () => {
    const src = readFileSync(
      resolve(root, "templates/layouts/brutalist/pages/Home.tsx"),
      "utf8"
    );
    expect(src).toContain("contactName");
  });
});
