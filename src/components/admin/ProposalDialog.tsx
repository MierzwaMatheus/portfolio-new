import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

interface ProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proposal?: any | null;
    onSave: () => void;
}

export function ProposalDialog({ open, onOpenChange, proposal, onSave }: ProposalDialogProps) {
    // Form State
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

    useEffect(() => {
        if (open) {
            if (proposal) {
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

                // Verificar se há método personalizado
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
            } else {
                resetForm();
            }
        }
    }, [open, proposal]);

    const resetForm = () => {
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
    };

    const checkSlugAvailability = async (slugToCheck: string) => {
        if (!slugToCheck) return;
        let query = supabase
            .schema('app_portfolio')
            .from('proposals')
            .select('id')
            .eq('slug', slugToCheck);

        if (proposal) {
            query = query.neq('id', proposal.id);
        }

        const { data } = await query.maybeSingle();

        if (data) {
            setSlugError("Este slug já está em uso.");
        } else {
            setSlugError("");
        }
    };

    const handleCreateProposal = async () => {
        if (slugError) return alert("Corrija o erro do slug antes de continuar.");
        if (!clientName || !slug) return alert("Preencha os campos obrigatórios.");

        const selectedPaymentMethods: string[] = [];
        if (payment50_50) selectedPaymentMethods.push("50% no início / 50% na entrega");
        if (payment100) selectedPaymentMethods.push("100% antecipado (desconto de 10%)");
        if (payment3x) selectedPaymentMethods.push("Parcelado em até 3x (sem juros)");
        if (paymentCustom && customPaymentMethod.trim()) {
            selectedPaymentMethods.push(customPaymentMethod.trim());
        }

        const selectedConditions = conditions
            .filter(c => c.checked)
            .map(c => c.text);

        const payload = {
            client_name: clientName,
            slug,
            created_at: new Date(createdAt).toISOString(),
            objective,
            scope: scopeItems,
            timeline: timelineItems,
            delivery_date: deliveryDate || null,
            investment_value: parseFloat(investmentValue.replace(',', '.')) || 0,
            payment_methods: selectedPaymentMethods,
            conditions: selectedConditions
        };

        if (proposal) {
            const { error } = await supabase
                .schema('app_portfolio')
                .from('proposals')
                .update(payload)
                .eq('id', proposal.id);

            if (error) {
                console.error("Error updating proposal:", error);
                alert("Erro ao atualizar proposta.");
            } else {
                alert("Proposta atualizada com sucesso!");
                onSave();
                onOpenChange(false);
            }
        } else {
            const { error } = await supabase
                .schema('app_portfolio')
                .from('proposals')
                .insert(payload);

            if (error) {
                console.error("Error creating proposal:", error);
                alert("Erro ao criar proposta.");
            } else {
                alert("Proposta criada com sucesso!");
                onSave();
                onOpenChange(false);
            }
        }
    };

    const calculateValidUntil = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        date.setDate(date.getDate() + 10);
        return date.toLocaleDateString('pt-BR');
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-white/10 max-w-2xl w-full max-h-[85vh] overflow-y-scroll text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {proposal ? "Editar Proposta" : "Nova Proposta"}
                    </DialogTitle>
                    <VisuallyHidden>
                        <h2>Formulário de {proposal ? "edição" : "criação"} de proposta</h2>
                    </VisuallyHidden>
                </DialogHeader>

                <div className="space-y-6 py-2">
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

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        <Button variant="ghost" onClick={() => {
                            onOpenChange(false);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleCreateProposal}
                        >
                            {proposal ? "Salvar" : "Criar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
