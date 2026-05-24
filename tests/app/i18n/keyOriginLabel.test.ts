import { describe, it, expect } from "vitest";
import { formatPathToLabel } from "@/i18n/utils/keyOriginLabel";

describe("formatPathToLabel — Ciclo 1: caminho → label legível", () => {
  it("retorna nome do componente sem extensão para caminho simples em components/", () => {
    expect(formatPathToLabel("components/AvailabilityBadge.tsx")).toBe("AvailabilityBadge");
  });

  it("retorna 'Pasta → Componente' quando há pasta intermediária não genérica", () => {
    expect(formatPathToLabel("components/home/Hero.tsx")).toBe("Home → Hero");
  });

  it("retorna nome do componente sem extensão para caminho em pages/", () => {
    expect(formatPathToLabel("pages/Login.tsx")).toBe("Login");
  });

  it("remove extensão .ts (sem x)", () => {
    expect(formatPathToLabel("utils/helper.ts")).toBe("helper");
  });

  it("capitaliza a pasta intermediária no label", () => {
    expect(formatPathToLabel("components/about/Section.tsx")).toBe("About → Section");
  });
});
