import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";

describe("StaticTranslationsRepository", () => {
  const repo = new StaticTranslationsRepository();

  it("returns string value via dot-notation key in pt-BR", () => {
    expect(repo.getStaticTranslation("common.loading", "pt-BR")).toBe(
      "Carregando...",
    );
  });

  it("returns string value via dot-notation key in en-US", () => {
    const result = repo.getStaticTranslation("common.save", "en-US");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("Salvar"); // should be EN, not PT
  });

  it("returns undefined when key does not exist", () => {
    expect(
      repo.getStaticTranslation("non.existent.path", "pt-BR"),
    ).toBeUndefined();
  });

  it("returns undefined when traversal hits a non-object before terminal key", () => {
    // common.loading is a string, so common.loading.something should fail
    expect(
      repo.getStaticTranslation("common.loading.subkey", "pt-BR"),
    ).toBeUndefined();
  });

  it("falls back to pt-BR when an unknown locale is requested", () => {
    const result = repo.getStaticTranslation("common.loading", "xx-XX");
    expect(result).toBe("Carregando...");
  });

  it("getStaticValue can return nested objects (not strings)", () => {
    const value = repo.getStaticValue("common", "pt-BR");
    expect(typeof value).toBe("object");
    expect(value.loading).toBe("Carregando...");
  });

  it("getStaticTranslation returns undefined for non-string nested objects", () => {
    expect(repo.getStaticTranslation("common", "pt-BR")).toBeUndefined();
  });

  it("getAllStaticTranslations returns the full pt-BR table", () => {
    const all = repo.getAllStaticTranslations("pt-BR");
    expect(typeof all).toBe("object");
    expect((all as any).common.loading).toBe("Carregando...");
  });

  it("getAllStaticTranslations falls back to pt-BR for unknown locale", () => {
    const all = repo.getAllStaticTranslations("xx-XX");
    expect((all as any).common.loading).toBe("Carregando...");
  });
});
