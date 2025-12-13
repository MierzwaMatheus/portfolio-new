import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, RefreshCw, Link as LinkIcon, X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Mock Data
const INITIAL_PROPOSALS = [
  { id: 1, client: "Maria", createdAt: "Invalid Date", validUntil: "", status: "Inativo" },
  { id: 2, client: "Aurora Tecnologia", createdAt: "17/06/2025", validUntil: "27/06/2025", status: "Ativo" },
  { id: 3, client: "teste", createdAt: "16/06/2025", validUntil: "26/06/2025", status: "Ativo" },
  { id: 4, client: "Delivery App", createdAt: "17/06/2025", validUntil: "27/06/2025", status: "Ativo" },
  { id: 5, client: "Deliveru=y App Simples", createdAt: "17/06/2025", validUntil: "27/06/2025", status: "Ativo" },
  { id: 6, client: "Eduardo", createdAt: "11/12/2025", validUntil: "21/12/2025", status: "Ativo" },
];

export default function AdminProposals() {
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [newScopeItem, setNewScopeItem] = useState("");
  const [timelineItems, setTimelineItems] = useState<{step: string, period: string}[]>([]);
  const [newTimelineStep, setNewTimelineStep] = useState("");
  const [newTimelinePeriod, setNewTimelinePeriod] = useState("");

  const handleAddScopeItem = () => {
    if (newScopeItem.trim()) {
      setScopeItems([...scopeItems, newScopeItem]);
      setNewScopeItem("");
    }
  };

  const handleRemoveScopeItem = (index: number) => {
    setScopeItems(scopeItems.filter((_, i) => i !== index));
  };

  const handleAddTimelineItem = () => {
    if (newTimelineStep.trim() && newTimelinePeriod.trim()) {
      setTimelineItems([...timelineItems, { step: newTimelineStep, period: newTimelinePeriod }]);
      setNewTimelineStep("");
      setNewTimelinePeriod("");
    }
  };

  const handleRemoveTimelineItem = (index: number) => {
    setTimelineItems(timelineItems.filter((_, i) => i !== index));
  };

  const handleCopyLink = (id: number) => {
    const link = `${window.location.origin}/proposta/${id}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado para a área de transferência!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-neon-purple">📄</span> Propostas Comerciais
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 max-w-2xl w-full max-h-[85vh] overflow-y-scroll text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Nova Proposta</DialogTitle>
                <VisuallyHidden>
                  <h2>Formulário de criação de proposta</h2>
                </VisuallyHidden>
              </DialogHeader>
              
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm mb-1">Nome do Cliente</Label>
                    <Input className="bg-background border-input" />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Slug</Label>
                    <Input className="bg-background border-input" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm mb-1">Data de Criação</Label>
                    <Input type="date" className="bg-background border-input" />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Validade</Label>
                    <Input className="bg-background border-input" disabled />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Objetivo do Projeto</Label>
                  <Textarea className="bg-background border-input min-h-[80px]" rows={3} />
                </div>

                <div>
                  <Label className="block text-sm mb-1">Escopo dos Serviços</Label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      placeholder="Adicionar item..." 
                      className="bg-background border-input"
                      value={newScopeItem}
                      onChange={(e) => setNewScopeItem(e.target.value)}
                    />
                    <Button onClick={handleAddScopeItem} className="bg-primary text-primary-foreground hover:bg-primary/90">Adicionar</Button>
                  </div>
                  <ul className="space-y-1">
                    {scopeItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                        <span>{item}</span>
                        <button onClick={() => handleRemoveScopeItem(index)} className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Cronograma</Label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      placeholder="Etapa" 
                      className="bg-background border-input"
                      value={newTimelineStep}
                      onChange={(e) => setNewTimelineStep(e.target.value)}
                    />
                    <Input 
                      placeholder="Período estimado" 
                      className="bg-background border-input"
                      value={newTimelinePeriod}
                      onChange={(e) => setNewTimelinePeriod(e.target.value)}
                    />
                    <Button onClick={handleAddTimelineItem} className="bg-primary text-primary-foreground hover:bg-primary/90">Adicionar</Button>
                  </div>
                  <ul className="space-y-1">
                    {timelineItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                        <span>{item.step} - {item.period}</span>
                        <button onClick={() => handleRemoveTimelineItem(index)} className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <Label className="block text-sm mb-1">Data Prevista para Entrega</Label>
                    <Input type="date" className="bg-background border-input" />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Valor do Projeto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                    <Input className="bg-background border-input pl-8" placeholder="0,00" />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Formas de Pagamento</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span className="text-sm">50% no início / 50% na entrega</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">100% antecipado (desconto de 10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="text-sm">Parcelado em até 3x (sem juros)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm">Personalizado</span>
                      </div>
                      <Textarea 
                        className="bg-background border-input min-h-[80px]" 
                        rows={2} 
                        placeholder="Detalhe a forma de pagamento personalizada..." 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Condições Gerais</Label>
                  <div className="flex flex-col gap-2">
                    {[
                      "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.",
                      "Garantia: correções de falhas por até 30 dias após entrega.",
                      "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.",
                      "Prazos: contagem começa após pagamento e recebimento dos materiais."
                    ].map((condition, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300" />
                        <Textarea 
                          defaultValue={condition}
                          className="bg-background border-input min-h-[60px] text-sm" 
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Criar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-300">Cliente</TableHead>
                <TableHead className="text-gray-300">Data de Criação</TableHead>
                <TableHead className="text-gray-300">Validade</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">{proposal.client}</TableCell>
                  <TableCell className="text-gray-400">{proposal.createdAt}</TableCell>
                  <TableCell className="text-gray-400">{proposal.validUntil}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${
                        proposal.status === "Ativo" 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      }`}
                    >
                      {proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={() => handleCopyLink(proposal.id)}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
