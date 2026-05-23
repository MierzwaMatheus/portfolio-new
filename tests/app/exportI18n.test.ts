import { describe, it, expect } from "vitest";
import { unflattenTranslations } from "../../scripts/export-i18n";

describe("unflattenTranslations", () => {
  it("converte chave simples em objeto aninhado", () => {
    const result = unflattenTranslations([{ key: "home.greeting", value: "Olá" }]);
    expect(result).toEqual({ home: { greeting: "Olá" } });
  });

  it("agrupa múltiplas chaves do mesmo nível", () => {
    const result = unflattenTranslations([
      { key: "home.greeting", value: "Olá" },
      { key: "home.title", value: "Título" },
    ]);
    expect(result).toEqual({ home: { greeting: "Olá", title: "Título" } });
  });

  it("suporta chaves com 3 ou mais níveis de aninhamento", () => {
    const result = unflattenTranslations([
      { key: "home.about.text", value: "Sobre" },
    ]);
    expect(result).toEqual({ home: { about: { text: "Sobre" } } });
  });

  it("retorna objeto vazio quando array de entrada é vazio", () => {
    expect(unflattenTranslations([])).toEqual({});
  });

  it("entradas de locales diferentes ficam em namespaces separados", () => {
    const result = unflattenTranslations([
      { key: "common.close", value: "Fechar" },
      { key: "navigation.home", value: "Início" },
    ]);
    expect(result).toEqual({
      common: { close: "Fechar" },
      navigation: { home: "Início" },
    });
  });
});
