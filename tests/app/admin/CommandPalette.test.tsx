import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

import { CommandPalette } from "@/components/admin/CommandPalette";

const items = [
  { label: "Dashboard", description: "Métricas e atividade recente", path: "/admin/dashboard" },
  { label: "Blog", description: "Posts, tags e busca", path: "/admin/blog" },
  { label: "Projetos", description: "Portfólio", path: "/admin/projects" },
];

describe("CommandPalette — Ciclo 1: renderiza items", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe cada item quando aberto", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Projetos")).toBeInTheDocument();
  });

  it("não exibe items quando fechado", () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={vi.fn()}
        items={items}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});

describe("CommandPalette — Ciclo 3: seleção navega e fecha", () => {
  it("chama onNavigate com o path correto ao clicar num item", async () => {
    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={true}
        onOpenChange={onOpenChange}
        items={items}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText("Blog"));
    expect(onNavigate).toHaveBeenCalledWith("/admin/blog");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
