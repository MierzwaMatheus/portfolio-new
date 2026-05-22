import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => undefined),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteConfig: {
      setBatch: "siteConfig:setBatch",
      setOgImage: "siteConfig:setOgImage",
    },
    images: {
      generateUploadUrl: "images:generateUploadUrl",
    },
  },
}));

import { useSiteConfig } from "@/hooks/useSiteConfig";
import AdminSiteConfig from "@/pages/admin/SiteConfig";

const mockUseSiteConfig = vi.mocked(useSiteConfig);

const defaultConfig = {
  site_title: "Meu Site",
  site_description: "Descrição do site",
  site_url: "https://exemplo.com",
  site_name: "Meu Site Portfolio",
  og_image_url: "",
  twitter_handle: "usuario",
  author_name: "Autor",
  author_email: "autor@exemplo.com",
  rss_title: "",
  rss_description: "",
  seo_home_title: "Título Home",
  seo_home_description: "Descrição Home",
  theme_accent_color: "#6366f1",
  theme_accent_hsl: "239 84% 67%",
  theme_font_sans: "Inter",
  theme_font_mono: "JetBrains Mono",
  theme_radius: "0.5rem",
  keywords: [],
  lang: "pt-BR",
  isLoading: false,
};

beforeEach(() => {
  mockUseSiteConfig.mockReturnValue(defaultConfig);
});

describe("SiteConfig — Ciclo 1: estrutura básica da página", () => {
  it("renderiza o heading da seção Aparência", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText("Aparência")).toBeInTheDocument();
  });

  it("renderiza o heading da seção SEO & Identidade", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText(/SEO/i)).toBeInTheDocument();
  });
});
