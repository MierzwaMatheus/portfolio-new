import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => []),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    siteTexts: {
      getAll: "siteTexts:getAll",
      update: "siteTexts:update",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/pages/admin/Dashboard", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useQuery } from "convex/react";
import AdminTextos from "@/pages/admin/Textos";

const mockUseQuery = vi.mocked(useQuery);

describe("Textos — Ciclo 1: estrutura básica da página", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([] as any);
  });

  it("renderiza o heading 'Textos do Site'", () => {
    render(<AdminTextos />);
    expect(screen.getByText("Textos do Site")).toBeInTheDocument();
  });

  it("renderiza campo de busca", () => {
    render(<AdminTextos />);
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });
});

describe("Textos — Ciclo 2: agrupamento por namespace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "2", key: "home.title", page: "home", ptBR: "Título", enUS: "Title" },
      { _id: "3", key: "about.intro", page: "about", ptBR: "Sobre", enUS: "About" },
    ] as any);
  });

  it("renderiza seção agrupada para namespace 'home'", () => {
    render(<AdminTextos />);
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("renderiza seção agrupada para namespace 'about'", () => {
    render(<AdminTextos />);
    expect(screen.getByText("about")).toBeInTheDocument();
  });

  it("exibe a chave de cada item dentro da seção correta", () => {
    render(<AdminTextos />);
    expect(screen.getByText("home.greeting")).toBeInTheDocument();
    expect(screen.getByText("about.intro")).toBeInTheDocument();
  });
});

describe("Textos — Ciclo 3: badge 'sem tradução EN'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "2", key: "home.missing", page: "home", ptBR: "Sem tradução" },
    ] as any);
  });

  it("exibe badge para item sem enUS", () => {
    render(<AdminTextos />);
    expect(screen.getByText(/sem tradução en/i)).toBeInTheDocument();
  });

  it("não exibe badge para item com enUS preenchido", () => {
    render(<AdminTextos />);
    const badges = screen.queryAllByText(/sem tradução en/i);
    expect(badges).toHaveLength(1);
  });
});
