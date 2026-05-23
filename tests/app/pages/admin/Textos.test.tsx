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

import AdminTextos from "@/pages/admin/Textos";

describe("Textos — Ciclo 1: estrutura básica da página", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
