import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, RefreshCw, Link as LinkIcon, X, Copy, KeyRound } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { supabase } from "@/lib/supabase";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import { toast } from "sonner";

export default function AdminProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [objective, setObjective] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [investmentValue, setInvestmentValue] = useState("");

  // Scope & Timeline
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [newScopeItem, setNewScopeItem] = useState("");
  const [timelineItems, setTimelineItems] = useState<{ step: string, period: string }[]>([]);
  const [newTimelineStep, setNewTimelineStep] = useState("");
  const [newTimelinePeriod, setNewTimelinePeriod] = useState("");

  // Payment & Conditions
  const [payment50_50, setPayment50_50] = useState(true);
  const [payment100, setPayment100] = useState(false);
  const [payment3x, setPayment3x] = useState(false);
  const [paymentCustom, setPaymentCustom] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState("");
  const [conditions, setConditions] = useState<Array<{ text: string; checked: boolean }>>([
    { text: "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.", checked: true },
    { text: "Garantia: correções de falhas por até 30 dias após entrega.", checked: true },
    { text: "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.", checked: true },
    { text: "Prazos: contagem começa após pagamento e recebimento dos materiais.", checked: true }
  ]);

  // Legal fields
  const [password, setPassword] = useState("");
  const [rescisionPolicy, setRescisionPolicy] = useState(DEFAULT_RESCISION_POLICY);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching proposals:", error);
    } else {
      setProposals(data || []);
    }
    setIsLoading(false);
  };

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) return;
    let query = supabase
      .schema('app_portfolio')
      .from('proposals')
      .select('id')
      .eq('slug', slugToCheck);
    
    // Se estiver editando, excluir a proposta atual da verificação
    if (editingProposal) {
      query = query.neq('id', editingProposal.id);
    }
    
    const { data, error } = await query.maybeSingle();

    if (data) {
      setSlugError("Este slug já está em uso.");
    } else {
      setSlugError("");
    }
  };

  const handleCreateProposal = async () => {
    if (slugError) return alert("Corrija o erro do slug antes de continuar.");
    if (!clientName || !slug) return alert("Preencha os campos obrigatórios.");

    // Verificar se proposta já foi aceita
    if (editingProposal?.is_accepted) {
      return alert("Esta proposta já foi aceita e não pode ser editada. Crie uma nova proposta.");
    }

    // Construir array de métodos de pagamento baseado nos checkboxes
    const selectedPaymentMethods: string[] = [];
    if (payment50_50) selectedPaymentMethods.push("50% no início / 50% na entrega");
    if (payment100) selectedPaymentMethods.push("100% antecipado (desconto de 10%)");
    if (payment3x) selectedPaymentMethods.push("Parcelado em até 3x (sem juros)");
    if (paymentCustom && customPaymentMethod.trim()) {
      selectedPaymentMethods.push(customPaymentMethod.trim());
    }

    // Construir array de condições baseado nos checkboxes marcados
    const selectedConditions = conditions
      .filter(c => c.checked)
      .map(c => c.text);

    // Garantir que a data seja sempre enviada corretamente
    const createdDate = createdAt ? new Date(createdAt + 'T00:00:00').toISOString() : new Date().toISOString();
    
    const payload = {
      title: title || null,
      client_name: clientName,
      slug,
      created_at: createdDate,
      objective,
      scope: scopeItems,
      timeline: timelineItems,
      delivery_date: deliveryDate || null,
      investment_value: parseFloat(investmentValue.replace(',', '.')) || 0,
      payment_methods: selectedPaymentMethods,
      conditions: selectedConditions,
      password: password || null,
      rescision_policy: rescisionPolicy || null
    };

    if (editingProposal) {
      // Criar snapshot da versão anterior antes de atualizar
      const currentVersion = editingProposal.version || 1;
      
      // Criar snapshot do conteúdo atual
      const { data: snapshotData, error: snapshotError } = await supabase.rpc('create_proposal_snapshot', {
        p_proposal_id: editingProposal.id
      });

      if (snapshotError) {
        console.error("Error creating snapshot:", snapshotError);
      } else {
        // Salvar versão anterior
        const { error: versionError } = await supabase
          .schema('app_portfolio')
          .from('proposal_versions')
          .insert({
            proposal_id: editingProposal.id,
            version: currentVersion,
            content_snapshot: snapshotData
          });

        if (versionError) {
          console.error("Error saving version:", versionError);
        }
      }

      // Incrementar versão e atualizar proposta
      const { error } = await supabase
        .schema('app_portfolio')
        .from('proposals')
        .update({
          ...payload,
          version: currentVersion + 1
        })
        .eq('id', editingProposal.id);

      if (error) {
        console.error("Error updating proposal:", error);
        alert("Erro ao atualizar proposta.");
      } else {
        alert("Proposta atualizada com sucesso! Uma nova versão foi criada.");
        setIsModalOpen(false);
        setEditingProposal(null);
        fetchProposals();
        resetForm();
      }
    } else {
      // Create new proposal
      const { error } = await supabase
        .schema('app_portfolio')
        .from('proposals')
        .insert(payload);

      if (error) {
        console.error("Error creating proposal:", error);
        alert("Erro ao criar proposta.");
      } else {
        alert("Proposta criada com sucesso!");
        setIsModalOpen(false);
        fetchProposals();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingProposal(null);
    setTitle("");
    setClientName("");
    setSlug("");
    setSlugError("");
    setCreatedAt(new Date().toISOString().split('T')[0]);
    setObjective("");
    setScopeItems([]);
    setTimelineItems([]);
    setDeliveryDate("");
    setInvestmentValue("");
    setPayment50_50(true);
    setPayment100(false);
    setPayment3x(false);
    setPaymentCustom(false);
    setCustomPaymentMethod("");
    setConditions([
      { text: "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.", checked: true },
      { text: "Garantia: correções de falhas por até 30 dias após entrega.", checked: true },
      { text: "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.", checked: true },
      { text: "Prazos: contagem começa após pagamento e recebimento dos materiais.", checked: true }
    ]);
    setPassword("");
    setRescisionPolicy(DEFAULT_RESCISION_POLICY);
  };

  const calculateValidUntil = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatus = (createdAtString: string) => {
    const created = new Date(createdAtString);
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + 10);
    const now = new Date();
    return now > validUntil ? "Inativo" : "Ativo";
  };

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

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/proposta/${slug}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado para a área de transferência!");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;

    const { error } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting proposal:", error);
      alert("Erro ao excluir proposta.");
    } else {
      alert("Proposta excluída com sucesso!");
      fetchProposals();
    }
  };

  const handleEdit = (proposal: any) => {
    setEditingProposal(proposal);
    setTitle(proposal.title || "");
    setClientName(proposal.client_name || "");
    setSlug(proposal.slug || "");
    setCreatedAt(new Date(proposal.created_at).toISOString().split('T')[0]);
    setObjective(proposal.objective || "");
    setDeliveryDate(proposal.delivery_date || "");
    setInvestmentValue(proposal.investment_value?.toString().replace('.', ',') || "");
    setScopeItems(Array.isArray(proposal.scope) ? proposal.scope : []);
    setTimelineItems(Array.isArray(proposal.timeline) ? proposal.timeline : []);
    
    // Carregar métodos de pagamento
    const paymentMethods = proposal.payment_methods || [];
    setPayment50_50(paymentMethods.includes("50% no início / 50% na entrega"));
    setPayment100(paymentMethods.includes("100% antecipado (desconto de 10%)"));
    setPayment3x(paymentMethods.includes("Parcelado em até 3x (sem juros)"));
    
    // Verificar se há método personalizado (não é uma das opções padrão)
    const standardMethods = [
      "50% no início / 50% na entrega",
      "100% antecipado (desconto de 10%)",
      "Parcelado em até 3x (sem juros)"
    ];
    const customMethod = paymentMethods.find((pm: string) => !standardMethods.includes(pm));
    if (customMethod) {
      setPaymentCustom(true);
      setCustomPaymentMethod(customMethod);
    } else {
      setPaymentCustom(false);
      setCustomPaymentMethod("");
    }
    
    // Carregar condições
    const savedConditions = proposal.conditions || [];
    const defaultConditions = [
      "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.",
      "Garantia: correções de falhas por até 30 dias após entrega.",
      "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.",
      "Prazos: contagem começa após pagamento e recebimento dos materiais."
    ];
    
    setConditions(defaultConditions.map(defaultText => ({
      text: defaultText,
      checked: savedConditions.includes(defaultText)
    })).concat(
      savedConditions
        .filter((sc: string) => !defaultConditions.includes(sc))
        .map((customText: string) => ({
          text: customText,
          checked: true
        }))
    ));
    
    // Carregar campos jurídicos
    setPassword(proposal.password || "");
    setRescisionPolicy(proposal.rescision_policy || DEFAULT_RESCISION_POLICY);
    
    setIsModalOpen(true);
  };

  const handleReload = async (id: number) => {
    const today = new Date().toISOString();
    const { error } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .update({ created_at: today })
      .eq('id', id);

    if (error) {
      console.error("Error updating proposal date:", error);
      alert("Erro ao atualizar data da proposta.");
    } else {
      alert("Data de criação atualizada para hoje!");
      fetchProposals();
    }
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
                <DialogTitle className="text-xl font-bold">
                  {editingProposal ? "Editar Proposta" : "Nova Proposta"}
                </DialogTitle>
                <VisuallyHidden>
                  <h2>Formulário de {editingProposal ? "edição" : "criação"} de proposta</h2>
                </VisuallyHidden>
              </DialogHeader>

              <div className="space-y-6 py-2">
                <div>
                  <Label className="block text-sm mb-1">Título da Proposta</Label>
                  <Input
                    className="bg-background border-input"
                    placeholder="Ex: Projeto para [Nome do Cliente]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm mb-1">Nome do Cliente</Label>
                    <Input
                      className="bg-background border-input"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Slug</Label>
                    <Input
                      className={`bg-background border-input ${slugError ? "border-red-500" : ""}`}
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugError("");
                      }}
                      onBlur={(e) => checkSlugAvailability(e.target.value)}
                    />
                    {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm mb-1">Data de Criação</Label>
                    <Input
                      type="date"
                      className="bg-background border-input"
                      value={createdAt}
                      onChange={(e) => setCreatedAt(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm mb-1">Validade</Label>
                    <Input
                      className="bg-background border-input"
                      disabled
                      value={calculateValidUntil(createdAt)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Objetivo do Projeto</Label>
                  <Textarea
                    className="bg-background border-input min-h-[80px]"
                    rows={3}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  />
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
                    <Input
                      type="date"
                      className="bg-background border-input"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Valor do Projeto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                    <Input
                      className="bg-background border-input pl-8"
                      placeholder="0,00"
                      value={investmentValue}
                      onChange={(e) => setInvestmentValue(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Formas de Pagamento</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={payment50_50}
                        onChange={(e) => setPayment50_50(e.target.checked)}
                        className="rounded border-gray-300" 
                      />
                      <span className="text-sm">50% no início / 50% na entrega</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={payment100}
                        onChange={(e) => setPayment100(e.target.checked)}
                        className="rounded border-gray-300" 
                      />
                      <span className="text-sm">100% antecipado (desconto de 10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={payment3x}
                        onChange={(e) => setPayment3x(e.target.checked)}
                        className="rounded border-gray-300" 
                      />
                      <span className="text-sm">Parcelado em até 3x (sem juros)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={paymentCustom}
                          onChange={(e) => setPaymentCustom(e.target.checked)}
                          className="rounded border-gray-300" 
                        />
                        <span className="text-sm">Personalizado</span>
                      </div>
                      {paymentCustom && (
                        <Textarea
                          className="bg-background border-input min-h-[80px]"
                          rows={2}
                          placeholder="Detalhe a forma de pagamento personalizada..."
                          value={customPaymentMethod}
                          onChange={(e) => setCustomPaymentMethod(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Condições Gerais</Label>
                  <div className="flex flex-col gap-2">
                    {conditions.map((condition, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input 
                          type="checkbox" 
                          checked={condition.checked}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[i].checked = e.target.checked;
                            setConditions(newConditions);
                          }}
                          className="mt-1 rounded border-gray-300" 
                        />
                        <Textarea
                          value={condition.text}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[i].text = e.target.value;
                            setConditions(newConditions);
                          }}
                          className="bg-background border-input min-h-[60px] text-sm"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Senha de Acesso (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      className="bg-background border-input"
                      placeholder="Deixe em branco para acesso público"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        // Gerar senha aleatória de 8 caracteres (A-Z, a-z, 0-9)
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let randomPassword = '';
                        for (let i = 0; i < 8; i++) {
                          randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setPassword(randomPassword);
                        toast.success("Senha gerada com sucesso!");
                      }}
                      title="Gerar senha aleatória"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {password && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(password);
                          toast.success("Senha copiada para a área de transferência!");
                        }}
                        title="Copiar senha"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Se definida, o cliente precisará informar esta senha para acessar a proposta.
                  </p>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Política de Rescisão</Label>
                  <Textarea
                    className="bg-background border-input min-h-[120px]"
                    rows={5}
                    placeholder="Descreva as hipóteses de rescisão, multas ou proporcionalidades, procedimentos e prazos..."
                    value={rescisionPolicy}
                    onChange={(e) => setRescisionPolicy(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta política será exibida na proposta e deve incluir hipóteses de rescisão, multas ou proporcionalidades, procedimentos e prazos.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                  <Button variant="ghost" onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}>Cancelar</Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCreateProposal}
                  >
                    {editingProposal ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
                  {proposals.filter(p => !p.is_accepted).map((proposal) => (
                    <TableRow key={proposal.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        {proposal.client_name}
                      </TableCell>
                      <TableCell className="text-gray-400">{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-gray-400">{calculateValidUntil(proposal.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`${getStatus(proposal.created_at) === "Ativo"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              }`}
                          >
                            {getStatus(proposal.created_at)}
                          </Badge>
                          {proposal.version > 1 && (
                            <span className="text-xs text-gray-500">v{proposal.version}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleEdit(proposal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDelete(proposal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleReload(proposal.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleCopyLink(proposal.slug)}
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
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-gray-300">Cliente</TableHead>
                    <TableHead className="text-gray-300">Data de Criação</TableHead>
                    <TableHead className="text-gray-300">Data de Aceite</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.filter(p => p.is_accepted).map((proposal) => (
                    <TableRow key={proposal.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        {proposal.client_name}
                        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          Aceita
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-gray-400">
                        {proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            Aceita
                          </Badge>
                          {proposal.version > 1 && (
                            <span className="text-xs text-gray-500">v{proposal.version}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleReload(proposal.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleCopyLink(proposal.slug)}
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
