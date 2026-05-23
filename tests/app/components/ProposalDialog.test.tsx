import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    proposals: { listAdmin: "proposals:listAdmin", create: "proposals:create", update: "proposals:update" },
    contractTemplates: { list: "contractTemplates:list" },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/constants/rescisionPolicy", () => ({ DEFAULT_RESCISION_POLICY: "Padrão" }));

import { useQuery, useMutation } from "convex/react";
import { ProposalDialog } from "@/components/admin/ProposalDialog";

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

const baseTemplates = [
  { _id: "t1", name: "Template A", isDefault: false, content: "A", createdAt: 0, updatedAt: 0 },
  { _id: "t2", name: "Template B", isDefault: true, content: "B", createdAt: 0, updatedAt: 0 },
];

function setup(templates: typeof baseTemplates | null = baseTemplates, proposal: any = null) {
  mockUseMutation.mockReturnValue(vi.fn() as any);
  mockUseQuery.mockImplementation((query: any) => {
    if (query === "contractTemplates:list") return templates;
    return [];
  });

  return render(
    <ProposalDialog
      open={true}
      onOpenChange={vi.fn()}
      proposal={proposal}
      onSave={vi.fn()}
    />,
  );
}

describe("ProposalDialog — Ciclo 2: seletor de template renderiza templates", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  it("exibe o seletor de template quando há templates disponíveis", () => {
    setup();
    expect(screen.getByText("Template de Contrato")).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });
});

describe("ProposalDialog — Ciclo 3: pré-seleção do template padrão", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  it("pré-seleciona o template marcado como isDefault ao abrir nova proposta", () => {
    setup();
    const combobox = screen.getByRole("combobox");
    // Radix Select exibe o nome do item selecionado no trigger
    expect(combobox.textContent).toContain("Template B");
  });
});

describe("ProposalDialog — Ciclo 4: estado vazio sem templates", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  it("oculta o seletor de template quando não há templates disponíveis", () => {
    setup([]);
    expect(screen.queryByText("Template de Contrato")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
