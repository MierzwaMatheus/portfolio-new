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

describe("SiteConfig — Ciclo 2: cor de destaque", () => {
  it("renderiza input de cor nativo com valor atual de theme_accent_color", () => {
    render(<AdminSiteConfig />);
    const colorInput = screen.getByTestId("color-picker-native");
    expect(colorInput).toHaveValue("#6366f1");
  });

  it("renderiza input hex com valor atual de theme_accent_color", () => {
    render(<AdminSiteConfig />);
    const hexInput = screen.getByTestId("color-picker-hex");
    expect(hexInput).toHaveValue("#6366f1");
  });

  it("exibe preview com cor de destaque atual", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-preview")).toBeInTheDocument();
  });

  it("hex inválido não atualiza a cor (mantém anterior)", async () => {
    const { container } = render(<AdminSiteConfig />);
    const hexInput = screen.getByTestId("color-picker-hex");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(hexInput, { target: { value: "invalido" } });
    const colorInput = container.querySelector('[data-testid="color-picker-native"]') as HTMLInputElement;
    expect(colorInput.value).toBe("#6366f1");
  });
});
