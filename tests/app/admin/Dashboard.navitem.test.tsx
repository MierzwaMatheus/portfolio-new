import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/textos"]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), checkRole: () => true }),
}));

vi.mock("@/contexts/PluginsContext", () => ({
  usePlugins: () => ({ isEnabled: () => true }),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: { siteConfig: { getAll: "siteConfig:getAll" } },
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AdminLayout } from "@/pages/admin/Dashboard";

describe("Dashboard — Ciclo 6: item 'Textos' no menu admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe link para /admin/textos na sidebar", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByRole("link", { name: /textos/i })).toBeInTheDocument();
  });

  it("o link aponta para /admin/textos", () => {
    render(<AdminLayout><div /></AdminLayout>);
    const link = screen.getByRole("link", { name: /textos/i });
    expect(link).toHaveAttribute("href", "/admin/textos");
  });
});
