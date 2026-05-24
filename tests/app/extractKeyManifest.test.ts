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

  it("ignora template literals — t(`key`) não é capturado", () => {
    const content = "const x = t(`home.title`);";
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({});
  });

  it("ignora chamadas com variável — t(variable) não é capturado", () => {
    const content = `const k = 'home.title'; t(k);`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result).toEqual({});
  });

  it("ignora template literals dinâmicos — t(`nav.${key}`) não é capturado", () => {
    const content = "t(`nav.${key}`)";
    const result = extractKeysFromContent(content, "Nav.tsx");
    expect(result).toEqual({});
  });

  it("acumula múltiplas ocorrências da mesma chave no mesmo arquivo", () => {
    const content = `t('home.title');\nt('home.title');`;
    const result = extractKeysFromContent(content, "Hero.tsx");
    expect(result["home.title"]).toHaveLength(2);
    expect(result["home.title"]).toEqual([
      { file: "Hero.tsx", line: 1 },
      { file: "Hero.tsx", line: 2 },
    ]);
  });
});

import { mergeManifests, extractKeysFromDir } from "../../scripts/extract-key-manifest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("mergeManifests", () => {
  it("combina manifests de arquivos diferentes para a mesma chave", () => {
    const a: ReturnType<typeof extractKeysFromContent> = { "home.title": [{ file: "A.tsx", line: 1 }] };
    const b: ReturnType<typeof extractKeysFromContent> = { "home.title": [{ file: "B.tsx", line: 5 }] };
    const result = mergeManifests(a, b);
    expect(result["home.title"]).toHaveLength(2);
    expect(result["home.title"]).toContainEqual({ file: "A.tsx", line: 1 });
    expect(result["home.title"]).toContainEqual({ file: "B.tsx", line: 5 });
  });

  it("mantém chaves exclusivas de cada manifesto", () => {
    const a = { "home.title": [{ file: "A.tsx", line: 1 }] };
    const b = { "nav.home": [{ file: "B.tsx", line: 3 }] };
    const result = mergeManifests(a, b);
    expect(result["home.title"]).toBeDefined();
    expect(result["nav.home"]).toBeDefined();
  });

  it("retorna manifesto vazio quando não recebe argumentos", () => {
    expect(mergeManifests()).toEqual({});
  });
});

describe("extractKeysFromDir", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "key-manifest-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("extrai chaves de arquivo .tsx na raiz do diretório", async () => {
    writeFileSync(join(tmpDir, "Hero.tsx"), `t('home.title')`);
    const result = await extractKeysFromDir(tmpDir);
    expect(result["home.title"]).toBeDefined();
    expect(result["home.title"][0].file).toBe("Hero.tsx");
    expect(result["home.title"][0].line).toBe(1);
  });

  it("varre subdiretórios recursivamente", async () => {
    const sub = join(tmpDir, "components");
    mkdirSync(sub);
    writeFileSync(join(sub, "Card.tsx"), `t('card.label')`);
    const result = await extractKeysFromDir(tmpDir);
    expect(result["card.label"]).toBeDefined();
    expect(result["card.label"][0].file).toContain("Card.tsx");
  });

  it("ignora arquivos que não são .ts ou .tsx", async () => {
    writeFileSync(join(tmpDir, "styles.css"), `t('should.be.ignored')`);
    writeFileSync(join(tmpDir, "readme.md"), `t('also.ignored')`);
    const result = await extractKeysFromDir(tmpDir);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("retorna manifesto vazio para diretório sem chamadas t()", async () => {
    writeFileSync(join(tmpDir, "Empty.tsx"), `const x = 1;`);
    const result = await extractKeysFromDir(tmpDir);
    expect(result).toEqual({});
  });
});
