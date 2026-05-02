import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Status = "new" | "read" | "contacted" | "in_progress" | "closed" | "archived";
type FlowType = "project" | "job" | "networking" | "feedback";

const STATUS_LABELS: Record<Status, string> = {
  new: "Novo",
  read: "Lido",
  contacted: "Contatado",
  in_progress: "Em andamento",
  closed: "Encerrado",
  archived: "Arquivado",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "bg-red-900/30 text-red-400 border-red-800",
  read: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  contacted: "bg-blue-900/30 text-blue-400 border-blue-800",
  in_progress: "bg-purple-900/30 text-purple-400 border-purple-800",
  closed: "bg-green-900/30 text-green-400 border-green-800",
  archived: "bg-gray-900/30 text-gray-400 border-gray-800",
};

const TYPE_LABELS: Record<FlowType, string> = {
  project: "💼 Projeto",
  job: "🧑‍💼 Emprego",
  networking: "🤝 Networking",
  feedback: "💬 Feedback",
};

const ANSWER_KEYS: Record<FlowType, Record<string, string>> = {
  project: { projectType: "Tipo de projeto", timeline: "Prazo estimado", budget: "Orçamento estimado", description: "Descrição" },
  job: { contractType: "Tipo de contrato", modality: "Modalidade", area: "Área", jobCompany: "Empresa", jobRole: "Cargo" },
  networking: { howFound: "Como encontrou", topic: "Assunto" },
  feedback: { about: "Sobre", message: "Mensagem" },
};

const BUDGET_VALUES: Record<string, string> = {
  small: "Até R$ 5.000",
  medium: "R$ 5.000 – R$ 15.000",
  large: "R$ 15.000 – R$ 30.000",
  enterprise: "Acima de R$ 30.000",
  unknown: "Ainda não sei",
};

const ANSWER_VALUES: Record<string, string> = {
  webapp: "Web App / SaaS", mobile: "Mobile", landing: "Landing Page",
  system: "Sistema Interno", consulting: "Consultoria Técnica", other: "Outro",
  urgent: "Urgente (< 1 mês)", short: "Curto (1–3 meses)", medium: "Médio (3–6 meses)", flexible: "Sem pressa",
  clt: "CLT", pj: "PJ / Contrato", freelance: "Freelance",
  remote: "Remoto", hybrid: "Híbrido", onsite: "Presencial",
  frontend: "Frontend", fullstack: "Full Stack", techlead: "Tech Lead / Arquitetura",
  blog: "Blog / Artigos", linkedin: "LinkedIn", referral: "Indicação", portfolio: "Portfólio",
  post: "Post do blog", project: "Projeto específico", general: "Portfolio em geral",
};

function resolveValue(key: string, value: string): string {
  if (key === "budget") return BUDGET_VALUES[value] ?? value;
  return ANSWER_VALUES[value] ?? value;
}

export default function AdminContactRequests() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<Id<"contactRequests"> | null>(null);
  const [note, setNote] = useState("");

  const requests = useQuery(api.contactRequests.list, {
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    limit: 100,
  });

  const selected = useQuery(
    api.contactRequests.get,
    selectedId ? { id: selectedId } : "skip"
  );

  const markRead = useMutation(api.contactRequests.markRead);
  const updateStatus = useMutation(api.contactRequests.updateStatus);
  const addNote = useMutation(api.contactRequests.addNote);

  const handleOpen = async (id: Id<"contactRequests">) => {
    setSelectedId(id);
    await markRead({ id });
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedId) return;
    try {
      await updateStatus({ id: selectedId, status: status as Status });
      toast.success("Status atualizado");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedId) return;
    try {
      await addNote({ id: selectedId, note });
      toast.success("Nota salva");
    } catch {
      toast.error("Erro ao salvar nota");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Contatos</h1>
            <p className="text-sm text-gray-400 mt-1">Solicitações recebidas pelo wizard de contato</p>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter ?? "all"} onValueChange={(v) => setTypeFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400 text-xs">Data</TableHead>
                <TableHead className="text-gray-400 text-xs">Tipo</TableHead>
                <TableHead className="text-gray-400 text-xs">Nome</TableHead>
                <TableHead className="text-gray-400 text-xs hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-gray-400 text-xs hidden md:table-cell">Origem</TableHead>
                <TableHead className="text-gray-400 text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests === undefined && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">Carregando...</TableCell>
                </TableRow>
              )}
              {requests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">Nenhuma solicitação encontrada</TableCell>
                </TableRow>
              )}
              {requests?.map((req) => (
                <TableRow
                  key={req._id}
                  className="border-white/5 hover:bg-white/5 cursor-pointer"
                  onClick={() => { setNote(req.adminNotes ?? ""); handleOpen(req._id); }}
                >
                  <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(req.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-xs text-white">
                    {TYPE_LABELS[req.type as FlowType] ?? req.type}
                  </TableCell>
                  <TableCell className="text-xs text-white font-medium">
                    {req.contactInfo.name}
                    {req.status === "new" && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400 hidden sm:table-cell">
                    {req.contactInfo.email}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 hidden md:table-cell">
                    {req.sourceContext ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[req.status as Status] ?? ""}`}>
                      {STATUS_LABELS[req.status as Status] ?? req.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="w-full sm:max-w-lg bg-background border-l border-white/10 overflow-y-auto p-6">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-white font-mono text-sm">
                  {TYPE_LABELS[selected.type as FlowType] ?? selected.type}
                </SheetTitle>
                <p className="text-xs text-gray-400">
                  {format(new Date(selected.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </SheetHeader>

              <div className="space-y-6">
                {/* Contact info */}
                <section>
                  <h3 className="text-xs font-mono text-neon-lime uppercase tracking-wider mb-3">Contato</h3>
                  <div className="space-y-1.5 text-sm">
                    <div><span className="text-gray-500">Nome: </span><span className="text-white">{selected.contactInfo.name}</span></div>
                    <div><span className="text-gray-500">Email: </span><a href={`mailto:${selected.contactInfo.email}`} className="text-neon-lime hover:underline">{selected.contactInfo.email}</a></div>
                    {selected.contactInfo.phone && <div><span className="text-gray-500">Telefone: </span><span className="text-white">{selected.contactInfo.phone}</span></div>}
                    {selected.contactInfo.linkedin && <div><span className="text-gray-500">LinkedIn: </span><a href={selected.contactInfo.linkedin.startsWith("http") ? selected.contactInfo.linkedin : `https://${selected.contactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-neon-lime hover:underline">{selected.contactInfo.linkedin}</a></div>}
                    {selected.contactInfo.company && <div><span className="text-gray-500">Empresa: </span><span className="text-white">{selected.contactInfo.company}</span></div>}
                  </div>
                </section>

                {/* Answers */}
                <section>
                  <h3 className="text-xs font-mono text-neon-lime uppercase tracking-wider mb-3">Respostas</h3>
                  <div className="space-y-2 font-mono text-xs">
                    {Object.entries(selected.answers as Record<string, string> ?? {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-gray-500 shrink-0">{ANSWER_KEYS[selected.type as FlowType]?.[k] ?? k}:</span>
                        <span className="text-white">{resolveValue(k, v)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Source */}
                {selected.sourceContext && (
                  <section>
                    <h3 className="text-xs font-mono text-neon-lime uppercase tracking-wider mb-2">Origem</h3>
                    <span className="text-sm text-gray-300 font-mono">{selected.sourceContext}</span>
                  </section>
                )}

                {/* Status */}
                <section>
                  <h3 className="text-xs font-mono text-neon-lime uppercase tracking-wider mb-3">Status</h3>
                  <Select value={selected.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </section>

                {/* Notes */}
                <section>
                  <h3 className="text-xs font-mono text-neon-lime uppercase tracking-wider mb-3">Notas internas</h3>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Adicione uma nota..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    className="mt-2 bg-neon-purple hover:bg-neon-purple/80 text-white text-xs"
                  >
                    Salvar nota
                  </Button>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
