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
import { Plus, Pencil, Trash2, RefreshCw, Link as LinkIcon, X, Copy, KeyRound, Upload } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { supabase } from "@/lib/supabase";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import { toast } from "sonner";

export default function AdminProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [jsonPasteContent, setJsonPasteContent] = useState("");

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

  const processJsonData = async (jsonData: any): Promise<boolean> => {
    // Validar campos obrigatórios
    if (!jsonData.client_name || !jsonData.slug) {
      toast.error("Erro: O JSON deve conter 'client_name' e 'slug' como campos obrigatórios.");
      return false;
    }

    // Verificar disponibilidade do slug
    const { data: existingProposal } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .select('id')
      .eq('slug', jsonData.slug)
      .maybeSingle();

    if (existingProposal) {
      toast.error(`Erro: O slug "${jsonData.slug}" já está em uso.`);
      return false;
    }

    // Processar dados do JSON
    const createdDate = jsonData.created_at 
      ? new Date(jsonData.created_at).toISOString() 
      : new Date().toISOString();

    // Validar e processar timeline
    let timelineItems: { step: string; period: string }[] = [];
    if (Array.isArray(jsonData.timeline)) {
      timelineItems = jsonData.timeline.map((item: any) => {
        if (typeof item === 'object' && item.step && item.period) {
          return { step: String(item.step), period: String(item.period) };
        }
        return null;
      }).filter((item: any) => item !== null);
    }

    // Validar e processar scope
    const scopeItems: string[] = Array.isArray(jsonData.scope) 
      ? jsonData.scope.map((item: any) => String(item))
      : [];

    // Validar e processar conditions
    const conditions: string[] = Array.isArray(jsonData.conditions)
      ? jsonData.conditions.map((item: any) => String(item))
      : [];

    // Processar rescision_policy: usar padrão se vazio/null/undefined
    const rescisionPolicy = jsonData.rescision_policy?.trim() 
      ? String(jsonData.rescision_policy)
      : DEFAULT_RESCISION_POLICY;

    // Criar payload
    const payload = {
      title: jsonData.title?.trim() || null,
      client_name: String(jsonData.client_name),
      slug: String(jsonData.slug),
      created_at: createdDate,
      objective: jsonData.objective?.trim() || '',
      scope: scopeItems,
      timeline: timelineItems,
      delivery_date: jsonData.delivery_date?.trim() || null,
      investment_value: typeof jsonData.investment_value === 'number' 
        ? jsonData.investment_value 
        : parseFloat(String(jsonData.investment_value || 0).replace(',', '.')) || 0,
      conditions: conditions,
      password: jsonData.password?.trim() || null,
      rescision_policy: rescisionPolicy
    };

    // Inserir no banco
    const { error } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .insert(payload);

    if (error) {
      console.error("Error creating proposal from JSON:", error);
      toast.error(`Erro ao criar proposta: ${error.message}`);
      return false;
    } else {
      toast.success("Proposta criada com sucesso a partir do JSON!");
      setIsJsonImportModalOpen(false);
      setJsonPasteContent("");
      fetchProposals();
      return true;
    }
  };

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Resetar o input
    event.target.value = '';

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await processJsonData(jsonData);
    } catch (error) {
      console.error("Error processing JSON file:", error);
      if (error instanceof SyntaxError) {
        toast.error("Erro: O arquivo JSON está mal formatado. Verifique a sintaxe.");
      } else {
        toast.error(`Erro ao processar arquivo JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  const handleJsonPaste = async () => {
    if (!jsonPasteContent.trim()) {
      toast.error("Por favor, cole o conteúdo JSON antes de importar.");
      return;
    }

    try {
      const jsonData = JSON.parse(jsonPasteContent);
      await processJsonData(jsonData);
    } catch (error) {
      console.error("Error processing pasted JSON:", error);
      if (error instanceof SyntaxError) {
        toast.error("Erro: O JSON colado está mal formatado. Verifique a sintaxe.");
      } else {
        toast.error(`Erro ao processar JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-neon-purple">📄</span> Propostas Comerciais
          </h1>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isJsonImportModalOpen} onOpenChange={setIsJsonImportModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-background hover:bg-background/90 text-white border-white/20 text-xs sm:text-sm"
                >
                  <Upload className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Importar JSON</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[85vh] overflow-y-scroll text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Importar Proposta via JSON
                  </DialogTitle>
                  <VisuallyHidden>
                    <h2>Dialog para importação de proposta via JSON</h2>
                  </VisuallyHidden>
                </DialogHeader>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                    <TabsTrigger value="paste">Colar JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div>
                      <Label className="block text-sm mb-2">Selecione um arquivo JSON</Label>
                      <input
                        id="json-upload"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleJsonUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-background hover:bg-background/90 text-white border-white/20"
                        onClick={() => document.getElementById('json-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Escolher Arquivo JSON
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Selecione um arquivo JSON válido com a estrutura da proposta
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4 mt-4">
                    <div>
                      <Label className="block text-sm mb-2">Cole o conteúdo JSON aqui</Label>
                      <Textarea
                        className="bg-background border-input min-h-[400px] font-mono text-sm"
                        placeholder='Cole o JSON aqui, por exemplo:&#10;{&#10;  "client_name": "Nome do Cliente",&#10;  "slug": "slug-da-proposta"&#10;  ...&#10;}'
                        value={jsonPasteContent}
                        onChange={(e) => setJsonPasteContent(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Cole o conteúdo completo do JSON no campo acima
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsJsonImportModalOpen(false);
                          setJsonPasteContent("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleJsonPaste}
                      >
                        Importar JSON
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white text-xs sm:text-sm">
                  <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Proposta</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-white/10 max-w-2xl w-full max-h-[85vh] flex flex-col text-white p-0 min-h-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle className="text-xl font-bold">
                  {editingProposal ? "Editar Proposta" : "Nova Proposta"}
                </DialogTitle>
                <VisuallyHidden>
                  <h2>Formulário de {editingProposal ? "edição" : "criação"} de proposta</h2>
                </VisuallyHidden>
              </DialogHeader>

              <div className="space-y-6 py-2 px-6 overflow-y-auto flex-1 min-h-0">
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
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Input
                      placeholder="Adicionar item..."
                      className="bg-background border-input flex-1"
                      value={newScopeItem}
                      onChange={(e) => setNewScopeItem(e.target.value)}
                    />
                    <Button onClick={handleAddScopeItem} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">Adicionar</Button>
                  </div>
                  <ul className="space-y-1">
                    {scopeItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm gap-2">
                        <span className="flex-1 wrap-break-word min-w-0">{item}</span>
                        <button onClick={() => handleRemoveScopeItem(index)} className="text-red-400 hover:text-red-300 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Cronograma</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Input
                      placeholder="Etapa"
                      className="bg-background border-input flex-1"
                      value={newTimelineStep}
                      onChange={(e) => setNewTimelineStep(e.target.value)}
                    />
                    <Input
                      placeholder="Período estimado"
                      className="bg-background border-input flex-1"
                      value={newTimelinePeriod}
                      onChange={(e) => setNewTimelinePeriod(e.target.value)}
                    />
                    <Button onClick={handleAddTimelineItem} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">Adicionar</Button>
                  </div>
                  <ul className="space-y-1">
                    {timelineItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm gap-2">
                        <span className="flex-1 wrap-break-word min-w-0">{item.step} - {item.period}</span>
                        <button onClick={() => handleRemoveTimelineItem(index)} className="text-red-400 hover:text-red-300 shrink-0">
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
                          className="mt-1 rounded border-gray-300 shrink-0" 
                        />
                        <Textarea
                          value={condition.text}
                          onChange={(e) => {
                            const newConditions = [...conditions];
                            newConditions[i].text = e.target.value;
                            setConditions(newConditions);
                          }}
                          className="bg-background border-input min-h-[60px] text-sm flex-1 min-w-0"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="block text-sm mb-1">Senha de Acesso (Opcional)</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      className="bg-background border-input flex-1"
                      placeholder="Deixe em branco para acesso público"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="flex gap-2 shrink-0">
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
              </div>

              <div className="border-t border-white/10 px-6 py-4 mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 bg-card">
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
            </DialogContent>
          </Dialog>
          </div>
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
                    <TableHead className="text-gray-300">Senha de Acesso</TableHead>
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
                      <TableCell className="text-gray-400">
                        {proposal.password ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{proposal.password}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                              onClick={() => {
                                navigator.clipboard.writeText(proposal.password);
                                toast.success("Senha copiada para a área de transferência!");
                              }}
                              title="Copiar senha"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Pública</span>
                        )}
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
