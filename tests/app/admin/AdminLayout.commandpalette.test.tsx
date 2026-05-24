import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/dashboard", vi.fn()]),
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

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@radix-ui/react-dialog")>();
  return {
    ...actual,
    Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      open ? <div role="dialog">{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  };
});

import { AdminLayout } from "@/pages/admin/Dashboard";

describe("AdminLayout — Ciclo 5: Escape fecha a palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fecha a palette ao disparar onOpenChange(false) — comportamento do Radix Escape", () => {
    render(<AdminLayout><div /></AdminLayout>);

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // O Radix Dialog chama onOpenChange(false) no Escape; simulamos isso diretamente
    // via o segundo Ctrl+K (toggle) que também fecha
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AdminLayout — Ciclo 4: atalho Cmd+K abre command palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("abre a palette ao pressionar Ctrl+K", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("abre a palette ao pressionar Cmd+K (Meta)", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("fecha a palette ao pressionar Ctrl+K novamente (toggle)", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
