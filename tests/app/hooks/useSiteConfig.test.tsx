import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { rubricalConfig } from "../../../rubrica.config";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteConfig: {
      getPublic: "siteConfig:getPublic",
    },
  },
}));

import { useQuery } from "convex/react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const mockUseQuery = vi.mocked(useQuery);

beforeEach(() => {
  mockUseQuery.mockReturnValue(undefined as any);
});

describe("useSiteConfig", () => {
  describe("enquanto Convex está carregando (undefined)", () => {
    it("retorna isLoading: true", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.isLoading).toBe(true);
    });

    it("retorna site_title a partir de rubricalConfig.siteName", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe(rubricalConfig.siteName);
    });

    it("retorna site_url a partir de rubricalConfig.siteUrl", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_url).toBe(rubricalConfig.siteUrl);
    });

    it("retorna lang a partir de rubricalConfig.lang", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.lang).toBe(rubricalConfig.lang);
    });
  });

  describe("quando Convex retorna dados", () => {
    it("retorna isLoading: false", () => {
      mockUseQuery.mockReturnValue([] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.isLoading).toBe(false);
    });

    it("sobrescreve site_title com valor do Convex", () => {
      mockUseQuery.mockReturnValue([
        { key: "site_title", value: "Override Title", createdAt: 1 },
      ] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe("Override Title");
    });

    it("preserva fallback quando Convex não tem a chave", () => {
      mockUseQuery.mockReturnValue([
        { key: "site_title", value: "Override Title", createdAt: 1 },
      ] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.lang).toBe(rubricalConfig.lang);
    });

    it("sobrescreve múltiplas chaves do Convex", () => {
      mockUseQuery.mockReturnValue([
        { key: "site_title", value: "Novo Título", createdAt: 1 },
        { key: "twitter_handle", value: "novousuario", createdAt: 1 },
      ] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe("Novo Título");
      expect(result.current.twitter_handle).toBe("novousuario");
    });
  });

  describe("todas as chaves estão presentes", () => {
    it("retorna todas as 19 chaves públicas", () => {
      mockUseQuery.mockReturnValue([] as any);
      const { result } = renderHook(() => useSiteConfig());
      const expectedKeys = [
        "site_title", "site_description", "site_url", "site_name",
        "og_image_url", "twitter_handle", "author_name", "author_email",
        "rss_title", "rss_description", "seo_home_title", "seo_home_description",
        "theme_accent_color", "theme_accent_hsl", "theme_font_sans",
        "theme_font_mono", "theme_radius", "keywords", "lang",
      ];
      for (const key of expectedKeys) {
        expect(result.current).toHaveProperty(key);
      }
    });

    it("keywords tem fallback de array vazio", () => {
      mockUseQuery.mockReturnValue([] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.keywords).toEqual([]);
    });

    it("theme_accent_hsl tem fallback de string vazia", () => {
      mockUseQuery.mockReturnValue([] as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.theme_accent_hsl).toBe("");
    });
  });
});
