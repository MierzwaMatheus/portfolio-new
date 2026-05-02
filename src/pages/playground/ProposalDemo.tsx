import { useState } from "react";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link as LinkIcon, Copy, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Proposal {
  id: string;
  slug: string;
  clientName: string;
  title: string;
  objective: string;
  scope: string[];
  deliveryDate: string;
  investmentValue: number;
  paymentMethods: string[];
  conditions: string[];
  isAccepted: boolean;
  acceptedAt?: number;
  createdAt: number;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
}

export default function ProposalDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [proposals, setProposals] = usePlaygroundStorage<Proposal[]>("pg_proposals", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerDoc, setSignerDoc] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const clientName = fd.get("clientName") as string;
    const title = fd.get("title") as string;
    if (!clientName || !title) return toast.error("Preencha os campos obrigatórios");

    const proposal: Proposal = {
      id: crypto.randomUUID(),
      slug: slugify(title) + "-" + Date.now().toString(36),
      clientName,
      title,
      objective: fd.get("objective") as string,
      scope: ((fd.get("scope") as string) || "").split("\n").filter(Boolean),
      deliveryDate: fd.get("deliveryDate") as string,
      investmentValue: Number(fd.get("value") || 0),
      paymentMethods: ["PIX", "Transferência"],
      conditions: [fd.get("conditions") as string].filter(Boolean),
      isAccepted: false,
      createdAt: Date.now(),
    };

    setProposals(prev => [proposal, ...prev]);
    toast.success("Proposta criada!");
    setIsDialogOpen(false);
    try { await logEvent({ sessionId, eventType: "playground.proposal_created", metadata: { clientName, title }, userAgent: navigator.userAgent }); } catch { /* */ }
  };

  const handleSign = async () => {
    if (!signerName || !signerDoc) return toast.error("Preencha nome e documento");
    setProposals(prev => prev.map(p => p.id === signingId ? { ...p, isAccepted: true, acceptedAt: Date.now() } : p));
    toast.success("Proposta assinada!");
    setSigningId(null);
    setSignerName("");
    setSignerDoc("");
    try { await logEvent({ sessionId, eventType: "playground.proposal_signed", metadata: { signerName }, userAgent: navigator.userAgent }); } catch { /* */ }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta proposta?")) return;
    setProposals(prev => prev.filter(p => p.id !== id));
    toast.success("Proposta excluída");
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/proposta/${slug}`);
    toast.success("Link copiado!");
  };

  return (
    <>
      <Helmet><title>Propostas — Playground</title></Helmet>
      <PlaygroundLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Propostas</h1>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nova Proposta</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma proposta criada ainda.</TableCell></TableRow>
                ) : proposals.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.clientName}</TableCell>
                    <TableCell className="text-sm">{p.title}</TableCell>
                    <TableCell className="text-sm">R$ {p.investmentValue.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.deliveryDate ? format(new Date(p.deliveryDate), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.isAccepted ? "default" : "outline"} className={p.isAccepted ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}>
                        {p.isAccepted ? "Aceita" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(p.slug)} title="Copiar link"><Copy className="h-3.5 w-3.5" /></Button>
                        {!p.isAccepted && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSigningId(p.id); setSignerName(""); setSignerDoc(""); }} title="Simular assinatura">
                            <FileSignature className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Nome do cliente *</Label><Input name="clientName" required /></div>
                <div className="space-y-1.5"><Label>Título da proposta *</Label><Input name="title" required /></div>
              </div>
              <div className="space-y-1.5"><Label>Objetivo</Label><Textarea name="objective" rows={3} /></div>
              <div className="space-y-1.5"><Label>Escopo (uma por linha)</Label><Textarea name="scope" rows={4} placeholder="Desenvolvimento do frontend&#10;Integração com API&#10;Testes e QA" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Data de entrega</Label><Input name="deliveryDate" type="date" /></div>
                <div className="space-y-1.5"><Label>Valor (R$)</Label><Input name="value" type="number" /></div>
              </div>
              <div className="space-y-1.5"><Label>Condições de pagamento</Label><Input name="conditions" placeholder="50% no início, 50% na entrega" /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Criar Proposta</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sign dialog */}
        <Dialog open={!!signingId} onOpenChange={() => setSigningId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Simular Assinatura Digital</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No sistema real, o cliente recebe um link, visualiza a proposta e assina com dados reais e hash de conteúdo.</p>
              <div className="space-y-1.5"><Label>Nome completo</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={signerDoc} onChange={e => setSignerDoc(e.target.value)} /></div>
              <div className="border border-dashed border-white/20 rounded h-20 flex items-center justify-center text-xs text-muted-foreground/40">[Canvas de assinatura manuscrita — simulado]</div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSigningId(null)}>Cancelar</Button>
                <Button onClick={handleSign}>Confirmar assinatura</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PlaygroundLayout>
    </>
  );
}
