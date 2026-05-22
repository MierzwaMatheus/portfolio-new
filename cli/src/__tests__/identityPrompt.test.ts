import { describe, it, expect, vi, beforeEach } from "vitest";
import { text, select, isCancel, cancel } from "@clack/prompts";

vi.mock("@clack/prompts", () => ({
  text: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

function setupAllMocks(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    siteName: "Meu Portfolio",
    siteUrl: "https://meusite.com",
    siteDescription: "Descrição do site.",
    authorName: "João Silva",
    authorEmail: "joao@meusite.com",
    twitterHandle: "joaosilva",
    lang: "pt-BR",
    ...overrides,
  };

  vi.mocked(isCancel).mockReturnValue(false);

  let textCallIndex = 0;
  const textOrder = [
    "siteName",
    "siteUrl",
    "siteDescription",
    "authorName",
    "authorEmail",
    "twitterHandle",
  ];
  vi.mocked(text).mockImplementation(async () => {
    const key = textOrder[textCallIndex++];
    return defaults[key] as string;
  });

  vi.mocked(select).mockResolvedValue(defaults["lang"] as string);
}

describe("identityPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna siteName informado pelo usuário", async () => {
    setupAllMocks({ siteName: "Portfolio do João" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.siteName).toBe("Portfolio do João");
  });
});
