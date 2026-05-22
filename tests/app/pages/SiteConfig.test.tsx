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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
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
    expect(screen.getByText("SEO & Identidade")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 6: salvamento via setBatch + toast", () => {
  it("renderiza botão 'Salvar Aparência'", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("btn-save-aparencia")).toBeInTheDocument();
  });

  it("renderiza botão 'Salvar SEO'", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("btn-save-seo")).toBeInTheDocument();
  });

  it("clicar em 'Salvar Aparência' chama setBatch com chaves de aparência", async () => {
    const { useMutation: mockUseMutation } = await import("convex/react");
    const mockSetBatch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseMutation).mockImplementation((fn: any) => {
      if (fn === "siteConfig:setBatch") return mockSetBatch;
      return vi.fn();
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<AdminSiteConfig />);
    fireEvent.click(screen.getByTestId("btn-save-aparencia"));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ key: "theme_accent_color" }),
          expect.objectContaining({ key: "theme_font_sans" }),
          expect.objectContaining({ key: "theme_font_mono" }),
          expect.objectContaining({ key: "theme_radius" }),
        ]),
      })
    );
  });

  it("clicar em 'Salvar SEO' chama setBatch com chaves de identidade", async () => {
    const { useMutation: mockUseMutation } = await import("convex/react");
    const mockSetBatch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseMutation).mockImplementation((fn: any) => {
      if (fn === "siteConfig:setBatch") return mockSetBatch;
      return vi.fn();
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<AdminSiteConfig />);
    fireEvent.click(screen.getByTestId("btn-save-seo"));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ key: "site_title" }),
          expect.objectContaining({ key: "site_description" }),
          expect.objectContaining({ key: "twitter_handle" }),
        ]),
      })
    );
  });
});

describe("SiteConfig — Ciclo 5: OG Image upload", () => {
  it("renderiza botão de upload de OG image", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("og-image-upload-button")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 4: seção SEO campos de texto e keywords", () => {
  it("renderiza input para site_title com valor atual", () => {
    render(<AdminSiteConfig />);
    const input = screen.getByTestId("input-site-title");
    expect(input).toHaveValue("Meu Site");
  });

  it("renderiza textarea para site_description com valor atual", () => {
    render(<AdminSiteConfig />);
    const textarea = screen.getByTestId("textarea-site-description");
    expect(textarea).toHaveValue("Descrição do site");
  });

  it("renderiza input para twitter_handle sem @", () => {
    render(<AdminSiteConfig />);
    const input = screen.getByTestId("input-twitter-handle");
    expect(input).toHaveValue("usuario");
    expect(input).not.toHaveValue("@usuario");
  });

  it("renderiza input para seo_home_title", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("input-seo-home-title")).toBeInTheDocument();
  });

  it("renderiza textarea para seo_home_description", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("textarea-seo-home-description")).toBeInTheDocument();
  });

  it("renderiza área de keywords", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("keywords-input")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 3: fontes e border radius", () => {
  it("renderiza select de fonte principal com as 5 opções curadas", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("select-font-sans")).toBeInTheDocument();
  });

  it("renderiza select de fonte mono com as 4 opções", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("select-font-mono")).toBeInTheDocument();
  });

  it("renderiza select de border radius com as 5 opções", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("select-radius")).toBeInTheDocument();
  });

  it("select de fonte principal mostra valor atual do config", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText("Inter")).toBeInTheDocument();
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
