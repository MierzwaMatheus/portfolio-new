import { useState } from "react";
import { useLocation } from "wouter";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlaygroundProposalDialog } from "@/components/playground/PlaygroundProposalDialog";
import type { PlaygroundProposal } from "@/components/playground/PlaygroundProposalDialog";

export default function ProposalDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [, setLocation] = useLocation();
  const [proposals, setProposals] = usePlaygroundStorage<PlaygroundProposal[]>("pg_proposals", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreate = async (data: Omit<PlaygroundProposal, "id" | "isAccepted" | "acceptedAt" | "acceptance" | "createdAt" | "expiresAt">) => {
    const now = Date.now();
    const proposal: PlaygroundProposal = {
      ...data,
      id: crypto.randomUUID(),
      isAccepted: false,
      createdAt: now,
      expiresAt: now + 10 * 24 * 60 * 60 * 1000,
    };
    setProposals(prev => [proposal, ...prev]);
    toast.success("Proposta criada!");
    try { await logEvent({ sessionId, eventType: "playground.proposal_created", metadata: { clientName: data.clientName, title: data.title }, userAgent: navigator.userAgent }); } catch { /* */ }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta proposta?")) return;
    setProposals(prev => prev.filter(p => p.id !== id));
    toast.success("Proposta excluída");
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/playground/proposal/${slug}`);
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
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLocation(`/playground/proposal/${p.slug}`)} title="Ver proposta">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(p.slug)} title="Copiar link"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <PlaygroundProposalDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          existingSlugs={proposals.map(p => p.slug)}
          onSave={handleCreate}
        />
      </PlaygroundLayout>
    </>
  );
}
