import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar, DollarSign, Download, AlertTriangle, FileCheck, Lock, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { ContractModal } from "@/components/ContractModal";
import { generateContractContent, generatePaymentMethods } from "@/utils/contractGenerator";

// Build a snake_case adapter so existing utils (contractGenerator, ContractModal) still work
function toLegacyProposal(p: any) {
  if (!p) return null;
  return {
    id: p._id,
    client_name: p.clientName,
    title: p.title,
    objective: p.objective,
    scope: p.scope,
    timeline: p.timeline,
    delivery_date: p.deliveryDate,
    investment_value: p.investmentValue,
    payment_methods: p.paymentMethods,
    conditions: p.conditions,
    rescision_policy: p.rescissionPolicy,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    is_accepted: p.isAccepted,
  };
}

export default function Proposal() {
  const { id } = useParams(); // This is the slug
  const slug = id ?? "";
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isRescisionOpen, setIsRescisionOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const createSessionMutation = useMutation(api.proposals.createSession);

  // Try recover token from sessionStorage on slug change
  useEffect(() => {
    setIsVisible(true);
    if (slug) {
      const stored = sessionStorage.getItem(`proposal_session_slug_${slug}`);
      if (stored) setSessionToken(stored);
    }
  }, [slug]);

  // Live query
  const queryResult = useQuery(
    api.proposals.getPublic,
    slug ? { slug, token: sessionToken ?? undefined } : "skip" as any
  );

  const isLoading = queryResult === undefined;
  const rawProposal: any = queryResult ?? null;

  // requiresPassword and gating
  const requiresPassword = !!rawProposal?.requiresPassword;
  const hasValidSession = !!rawProposal?.hasValidSession;
  const showPasswordForm = requiresPassword && !hasValidSession && !sessionToken;

  // Adapt to legacy snake_case for utils
  const proposal: any = useMemo(() => toLegacyProposal(rawProposal), [rawProposal]);

  // acceptanceData may come from getPublic (per spec) — try snake_case fallback for util compatibility
  const acceptanceDataRaw: any = rawProposal?.acceptanceData ?? null;
  const acceptanceData: any = useMemo(() => {
    if (!acceptanceDataRaw) return null;
    return {
      client_name: acceptanceDataRaw.clientName ?? acceptanceDataRaw.client_name,
      client_document: acceptanceDataRaw.clientDocument ?? acceptanceDataRaw.client_document,
      client_email: acceptanceDataRaw.clientEmail ?? acceptanceDataRaw.client_email,
      client_role: acceptanceDataRaw.clientRole ?? acceptanceDataRaw.client_role ?? null,
      client_declaration: acceptanceDataRaw.clientDeclaration ?? acceptanceDataRaw.client_declaration ?? null,
      accepted_at: typeof (acceptanceDataRaw.acceptedAt ?? acceptanceDataRaw.accepted_at) === "number"
        ? new Date(acceptanceDataRaw.acceptedAt ?? acceptanceDataRaw.accepted_at).toISOString()
        : (acceptanceDataRaw.accepted_at ?? acceptanceDataRaw.acceptedAt),
      ip_address: acceptanceDataRaw.ipAddress ?? acceptanceDataRaw.ip_address ?? null,
      user_agent: acceptanceDataRaw.userAgent ?? acceptanceDataRaw.user_agent ?? null,
      content_hash: acceptanceDataRaw.contentHash ?? acceptanceDataRaw.content_hash ?? null,
      proposal_version: acceptanceDataRaw.proposalVersion ?? acceptanceDataRaw.proposal_version ?? "1.0",
    };
  }, [acceptanceDataRaw]);

  const isExpired = !!rawProposal?.isExpired;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    try {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      const result: any = await createSessionMutation({
        slug,
        password,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      });

      // Convex returns either a token string or { token } depending on impl
      const token: string | undefined = typeof result === "string" ? result : result?.token;
      if (token) {
        setSessionToken(token);
        sessionStorage.setItem(`proposal_session_slug_${slug}`, token);
        toast.success("Acesso autorizado");
      } else {
        toast.error("Erro ao criar sessão");
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("invalid password") || msg.includes("incorreta")) {
        toast.error("Senha incorreta");
      } else {
        console.error("Error creating session:", error);
        toast.error(msg || "Erro ao criar sessão");
      }
    }
  };

  const calculateValidUntil = (createdAt: string | number | undefined) => {
    if (!createdAt) return "";
    const date = typeof createdAt === "number" ? new Date(createdAt) : new Date(createdAt);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!proposal || !acceptanceData) return;
    try {
      await generateContractPDF(proposal, acceptanceData);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 50 }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center">Carregando proposta...</div>;
  }

  if (!rawProposal) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center">Proposta não encontrada.</div>;
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-neon-purple mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Acesso Protegido</h1>
              <p className="text-gray-400">Esta proposta está protegida por senha. Informe a senha para continuar.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-background border-input mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90">
                Acessar Proposta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-neon-purple selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none no-print">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        {rawProposal.isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Esta proposta foi aceita eletronicamente</p>
                  {acceptanceData ? (
                    <p className="text-sm text-green-300/80">
                      Aceita em {new Date(acceptanceData.accepted_at).toLocaleString('pt-BR')} por {acceptanceData.client_name}
                    </p>
                  ) : (
                    <p className="text-sm text-green-300/80">Carregando informações do aceite...</p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={!acceptanceData}
              >
                <FileText className="w-4 h-4 mr-2" />
                Baixar PDF do Contrato
              </Button>
            </div>
          </motion.div>
        )}
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">Atenção: Esta proposta expirou em {calculateValidUntil(rawProposal.createdAt)}.</p>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-16"
        >
          <motion.header variants={itemVariants} className="text-center space-y-6">
            <Badge variant="outline" className="border-neon-purple text-neon-purple px-4 py-1 text-sm uppercase tracking-widest">
              Proposta Comercial
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              {rawProposal.title || `Projeto para ${rawProposal.clientName}`}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Preparado especialmente para <span className="text-white font-semibold">{rawProposal.clientName}</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-4">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Calendar className="w-4 h-4 text-neon-purple" />
                <span>Criado em: {new Date(rawProposal.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Clock className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-neon-green"}`} />
                <span className={isExpired ? "text-red-400" : ""}>Válido até: {calculateValidUntil(rawProposal.createdAt)}</span>
              </div>
            </div>
          </motion.header>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Apresentação
                </h2>
                <div className="text-lg text-gray-300 leading-relaxed space-y-4">
                  <p>Olá, tudo bem?</p>
                  <p>
                  Antes de tudo, agradeço o interesse! Sou Matheus Mierzwa, Arquiteto de Soluções Digitais e Tech Lead Frontend com mais de 4 anos de experiência transformando desafios complexos em ecossistemas digitais robustos.
                  </p>
                  <p>
                  Minha expertise vai além de código. Desenho arquiteturas escaláveis,lidero equipes técnicas, defino padrões de excelência e conduzo decisões estratégicas que impactam produtos inteiros. Especializado em React, TypeScript, infraestrutura moderna e integração inteligente de IA.
                  </p>
                  <p>
                  Meu objetivo é simples: transformar sua visão em uma solução que seja simultaneamente elegante, escalável e inteligente. Vamos onversar sobre como isso pode funcionar no seu projeto?
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Objetivo do Projeto
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {rawProposal.objective}
                </p>
              </CardContent>
            </Card>
          </motion.section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-purple/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-neon-purple" />
                    Escopo dos Serviços
                  </h2>
                  <ul className="space-y-4">
                    {rawProposal.scope?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300 group">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple group-hover:scale-150 transition-transform" />
                        <span className="group-hover:text-white transition-colors w-[95%]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-green/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Clock className="w-6 h-6 text-neon-lime" />
                    Cronograma Estimado
                  </h2>
                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neon-lime" />
                    <div className="space-y-8">
                      {rawProposal.timeline?.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isVisible ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: index * 0.1 }}
                          className="group relative"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <div className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full bg-border border border-neon-green/40 group-hover:border-neon-green transition-all duration-300 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-lime/50 group-hover:bg-neon-lime group-hover:scale-125 transition-all duration-300" />
                              </div>
                            </div>
                            <div className="flex-1 pt-0.5 space-y-1">
                              <h4 className="text-white font-semibold text-base group-hover:text-neon-green transition-colors duration-300">
                                {item.step}
                              </h4>
                              <p className="text-sm text-gray-400 font-light">{item.period}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {rawProposal.deliveryDate && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">Entrega prevista: <span className="text-white">{new Date(rawProposal.deliveryDate).toLocaleDateString('pt-BR')}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          </div>

          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-card to-black border-white/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-white">Investimento Total</h2>
                    <p className="text-gray-400 max-w-md">
                      Um investimento estratégico para elevar o nível do seu negócio e alcançar novos resultados.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-2">
                      {formatCurrency(rawProposal.investmentValue)}
                    </div>
                    <Badge className="bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border-neon-green/20">
                      Pagamento Facilitado
                    </Badge>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-neon-purple" />
                      Formas de Pagamento
                    </h3>
                    <ul className="space-y-2">
                      {generatePaymentMethods(rawProposal.investmentValue).map((method: string, idx: number) => (
                        <li key={idx} className="text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-500 rounded-full" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-neon-purple" />
                      Condições Gerais
                    </h3>
                    <ul className="space-y-2">
                      {rawProposal.conditions?.map((condition: string, idx: number) => (
                        <li key={idx} className="text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-500 rounded-full" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardContent className="p-8 md:p-10 relative z-10">
                <Collapsible open={isRescisionOpen} onOpenChange={setIsRescisionOpen}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer outline-none relative z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-1 h-8 bg-neon-purple rounded-full" />
                      Política de Rescisão
                    </h2>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${isRescisionOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 prose-hr:border-white/10 max-w-none">
                      <ReactMarkdown>
                        {rawProposal.rescissionPolicy || DEFAULT_RESCISION_POLICY}
                      </ReactMarkdown>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </motion.section>

          {!rawProposal.isAccepted && (
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
              <Button
                size="lg"
                className="bg-neon-purple hover:bg-neon-purple/90 text-white h-14 px-8 w-full sm:w-auto"
                onClick={() => {
                  if (sessionToken) {
                    sessionStorage.setItem(`proposal_session_slug_${slug}`, sessionToken);
                  }
                  setLocation(`/proposta/${id}/aceitar`);
                }}
              >
                <FileCheck className="mr-2 w-5 h-5" />
                Aceitar Proposta Eletronicamente
              </Button>
            </motion.div>
          )}

          {rawProposal.isAccepted && acceptanceData && (
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
              <Button
                size="lg"
                className="bg-neon-purple hover:bg-neon-purple/90 text-white h-14 px-8 w-full sm:w-auto"
                onClick={() => setShowContractModal(true)}
              >
                <FileText className="mr-2 w-5 h-5" />
                Ler Contrato
              </Button>
            </motion.div>
          )}

          <motion.footer variants={itemVariants} className="text-center border-t border-white/10 pt-8 pb-4">
            <p className="text-gray-500 text-sm">
              © 2025 Matheus Mierzwa. Todos os direitos reservados.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Esta proposta é confidencial e destinada apenas ao cliente especificado.
            </p>
          </motion.footer>
        </motion.div>
      </div>

      {rawProposal.isAccepted && acceptanceData && (
        <ContractModal
          open={showContractModal}
          onOpenChange={setShowContractModal}
          proposal={proposal}
          clientData={{
            client_name: acceptanceData.client_name,
            client_document: acceptanceData.client_document,
            client_email: acceptanceData.client_email,
            client_role: acceptanceData.client_role || null,
            client_declaration: acceptanceData.client_declaration || null,
          }}
          sessionToken={null}
          onSign={handleDigitalSignature}
          isSigning={false}
        />
      )}
    </div>
  );

  async function handleDigitalSignature() {
    if (!proposal || !acceptanceData) return;
    try {
      await generateContractPDF(proposal, acceptanceData);
      toast.success("PDF do contrato gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    }
  }

  async function generateContractPDF(proposal: any, acceptanceData: any) {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    const checkPageBreak = (requiredSpace: number = 10) => {
      if (yPos + requiredSpace > 270) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: [number, number, number] = [0, 0, 0], lineHeight: number = 0.6) => {
      if (!text || String(text).trim() === '') return;

      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      let cleanText = String(text)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/---/g, '')
        .trim();

      const lines = doc.splitTextToSize(cleanText, maxWidth);

      lines.forEach((line: string) => {
        checkPageBreak(fontSize * lineHeight + 2);
        doc.text(line, margin, yPos);
        yPos += fontSize * lineHeight;
      });
      yPos += 2;
    };

    const contractContent = generateContractContent(proposal, acceptanceData);

    addText('CONTRATO ELETRÔNICO', 18, true, [0, 0, 0]);
    yPos += 5;

    const headerText = contractContent.header
      .replace(/\*\*/g, '')
      .replace(/---/g, '')
      .trim();
    addText(headerText, 12);
    yPos += 5;

    contractContent.clauses.forEach((clause) => {
      let cleanClause = clause
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();

      const titleMatch = cleanClause.match(/^(CLÁUSULA \d+[^:]*:)/);
      if (titleMatch) {
        addText(titleMatch[1], 12, true, [0, 0, 0], 0.7);
        cleanClause = cleanClause.replace(titleMatch[1], '').trim();
      }

      if (cleanClause) {
        addText(cleanClause, 11, false, [0, 0, 0], 0.6);
      }
      yPos += 3;
    });

    addText('ASSINATURA DIGITAL', 14, true);
    addText(`Este contrato foi assinado digitalmente em ${new Date(acceptanceData.accepted_at).toLocaleString('pt-BR')}`, 11);
    addText(`Nome: ${acceptanceData.client_name}`, 11);
    addText(`Documento: ${acceptanceData.client_document}`, 11);
    addText(`E-mail: ${acceptanceData.client_email}`, 11);
    if (acceptanceData.client_role) {
      addText(`Cargo/Função: ${acceptanceData.client_role}`, 11);
    }
    if (acceptanceData.client_declaration) {
      addText(`Declaração: ${acceptanceData.client_declaration}`, 10);
    }
    yPos += 5;

    addText('EVIDÊNCIAS TÉCNICAS', 12, true);
    addText(`Hash SHA-256: ${acceptanceData.content_hash || 'N/A'}`, 9);
    addText(`IP de Origem: ${acceptanceData.ip_address || 'N/A'}`, 9);
    addText(`User-Agent: ${acceptanceData.user_agent || 'N/A'}`, 9);
    addText(`Versão da Proposta: ${acceptanceData.proposal_version || '1.0'}`, 9);

    const fileName = `Contrato_${proposal.client_name.replace(/\s+/g, '_')}_${new Date(acceptanceData.accepted_at).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
