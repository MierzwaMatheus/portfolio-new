import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const src = readFileSync(resolve(ROOT, "src/pages/NotFound.tsx"), "utf-8");

describe("NotFound — iteração de linhas via Object.values", () => {
  it("não usa cast para string[] diretamente no tValue(notFound.lines)", () => {
    expect(src).not.toMatch(/tValue\("notFound\.lines"\) as string\[\]/);
  });

  it("usa Object.values para iterar as linhas", () => {
    expect(src).toMatch(/Object\.values\(/);
  });
});
