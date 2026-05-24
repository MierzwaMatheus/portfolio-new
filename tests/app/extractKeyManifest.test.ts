import { describe, it, expect } from "vitest";
import { extractKeysFromContent } from "../../scripts/extract-key-manifest";

describe("extractKeysFromContent", () => {
  it("extrai chamada t() simples com aspas simples", () => {
    const content = `const x = t('home.title');`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({ "home.title": [{ file: "Hero.tsx", line: 1 }] });
  });

  it("extrai chamada t() com aspas duplas", () => {
    const content = `const x = t("home.greeting");`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({ "home.greeting": [{ file: "Hero.tsx", line: 1 }] });
  });

  it("extrai múltiplas chaves diferentes de linhas diferentes", () => {
    const content = `const a = t('home.title');\nconst b = t('home.subtitle');`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({
      "home.title": [{ file: "Hero.tsx", line: 1 }],
      "home.subtitle": [{ file: "Hero.tsx", line: 2 }],
    });
  });

  it("retorna manifesto vazio quando não há chamadas t()", () => {
    const content = `const x = 'hello';`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({});
  });
});
