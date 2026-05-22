import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";

vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: vi.fn(),
}));

import { useSiteConfig } from "@/hooks/useSiteConfig";
import { SEO } from "@/components/SEO";

const mockUseSiteConfig = vi.mocked(useSiteConfig);

const defaultConfig = {
  site_title: "Site Neutro",
  site_description: "Descrição padrão do site",
  site_url: "https://exemplo.com",
  site_name: "Site Neutro Portfolio",
  og_image_url: "https://exemplo.com/og.jpg",
  twitter_handle: "usuario",
  author_name: "",
  author_email: "",
  rss_title: "",
  rss_description: "",
  seo_home_title: "",
  seo_home_description: "",
  theme_accent_color: "#6366f1",
  theme_accent_hsl: "",
  theme_font_sans: "Inter",
  theme_font_mono: "JetBrains Mono",
  theme_radius: "0.5rem",
  keywords: [],
  lang: "pt-BR",
  isLoading: false,
};

function renderSEO(props: Parameters<typeof SEO>[0]) {
  return render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  );
}

beforeEach(() => {
  mockUseSiteConfig.mockReturnValue(defaultConfig);
});

describe("SEO", () => {
  describe("Ciclo 4 — siteUrl", () => {
    it("usa site_url do useSiteConfig no link canonical quando url prop não fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const link = document.querySelector('link[rel="canonical"]');
        expect(link?.getAttribute("href")).toBe("https://exemplo.com");
      });
    });

    it("usa site_url do useSiteConfig no og:url quando url prop não fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:url"]');
        expect(meta?.getAttribute("content")).toBe("https://exemplo.com");
      });
    });

    it("não contém domínio pessoal hardcoded no canonical", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const link = document.querySelector('link[rel="canonical"]');
        expect(link?.getAttribute("href")).not.toContain("mmlo.com.br");
      });
    });
  });

  describe("Ciclo 3 — OG image URL", () => {
    it("usa og_image_url do useSiteConfig como imagem padrão quando image prop não é fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).toBe("https://exemplo.com/og.jpg");
      });
    });

    it("não contém URL de imagem pessoal hardcoded no og:image", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).not.toContain("postimg.cc");
      });
    });

    it("usa image prop quando fornecida, ignorando o default", async () => {
      renderSEO({ title: "Página", image: "https://outro.com/img.jpg" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).toBe("https://outro.com/img.jpg");
      });
    });
  });

  describe("Ciclo 2 — defaultDescription", () => {
    it("usa site_description do useSiteConfig como meta description padrão", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).toBe("Descrição padrão do site");
      });
    });

    it("não contém descrição pessoal hardcoded", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).not.toContain("Matheus Mierzwa");
      });
    });

    it("usa description prop quando fornecida, ignorando o default", async () => {
      renderSEO({ title: "Página", description: "Descrição customizada" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).toBe("Descrição customizada");
      });
    });
  });

  describe("Ciclo 1 — siteTitle e fullTitle", () => {
    it("usa site_title do useSiteConfig como sufixo do título", async () => {
      renderSEO({ title: "Minha Página" });
      await waitFor(() => expect(document.title).toBe("Minha Página | Site Neutro"));
    });

    it("não repete o sufixo quando title já é o site_title", async () => {
      renderSEO({ title: "Site Neutro" });
      await waitFor(() => expect(document.title).toBe("Site Neutro"));
    });

    it("não contém nome pessoal hardcoded no título", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => expect(document.title).not.toContain("Matheus Mierzwa"));
    });
  });
});
