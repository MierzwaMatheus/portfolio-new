import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar, DollarSign, Download, AlertTriangle, FileCheck, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";

export default function Proposal() {
  const { id } = useParams(); // This is the slug
  const [location, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    if (id) {
      fetchProposal(id);
    }
  }, [id]);

  const fetchProposal = async (slug: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('proposals')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error("Error fetching proposal:", error);
    } else if (data) {
      setProposal(data);
      checkExpiration(data.created_at);
      
      // Se tem senha, mostrar formulário de senha
      if (data.password) {
        setShowPasswordForm(true);
      } else {
        // Se não tem senha, criar sessão automaticamente
        await createSession(data.id);
      }
    }
    setIsLoading(false);
  };

  const createSession = async (proposalId: string) => {
    try {
      // Obter IP e User-Agent do cliente
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      
      const userAgent = navigator.userAgent;

      // Chamar função RPC usando SQL direto já que está em schema diferente
      const { data, error } = await supabase.rpc('create_proposal_session', {
        p_proposal_id: proposalId,
        p_password: password || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        if (error.message.includes('Senha incorreta') || error.message.includes('incorreta')) {
          toast.error("Senha incorreta");
        } else {
          console.error("Error creating session:", error);
          // Se não conseguir criar sessão, ainda permite visualizar (modo leitura)
        }
      } else {
        setSessionToken(data);
        setShowPasswordForm(false);
        // Armazenar token na sessionStorage para usar na página de aceite
        if (data) {
          sessionStorage.setItem(`proposal_session_${proposalId}`, data);
        }
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      // Em caso de erro, ainda permite visualizar a proposta
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;
    
    try {
      // Obter IP e User-Agent do cliente
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('create_proposal_session', {
        p_proposal_id: proposal.id,
        p_password: password,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        if (error.message.includes('Senha incorreta') || error.message.includes('incorreta')) {
          toast.error("Senha incorreta");
        } else {
          console.error("Error creating session:", error);
          toast.error("Erro ao criar sessão");
        }
      } else {
        setSessionToken(data);
        setShowPasswordForm(false);
        // Armazenar token na sessionStorage para usar na página de aceite
        if (data) {
          sessionStorage.setItem(`proposal_session_${proposal.id}`, data);
        }
        toast.success("Acesso autorizado");
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.message || "Erro ao criar sessão");
    }
  };

  const checkExpiration = (createdAt: string) => {
    const created = new Date(createdAt);
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + 10);
    const now = new Date();
    if (now > validUntil) {
      setIsExpired(true);
    }
  };

  const calculateValidUntil = (createdAt: string) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDownloadPDF = () => {
    // Encontrar o container principal
    const content = document.querySelector('.relative.z-10') as HTMLElement;
    if (!content) return;

    // Salvar estilos originais para restaurar depois
    const originalStyles: Map<HTMLElement, string> = new Map();

    // Função para aplicar estilos inline diretamente nos elementos
    const applyPrintStyles = (element: HTMLElement) => {
      const tagName = element.tagName.toLowerCase();
      const classList = Array.from(element.classList);
      
      // Salvar estilo original se existir
      if (element.style.cssText) {
        originalStyles.set(element, element.style.cssText);
      }

      // Ocultar elementos que não devem ser impressos
      if (classList.some(c => c.includes('no-print'))) {
        element.style.display = 'none';
        return;
      }

      // Forçar fundo branco em containers
      if (['div', 'section', 'article', 'header', 'footer', 'card'].includes(tagName) || 
          classList.some(c => c.includes('Card') || c.includes('card'))) {
        element.style.setProperty('background', '#ffffff', 'important');
        element.style.setProperty('background-color', '#ffffff', 'important');
      }

      // Forçar cores de texto escuras - verificar cor computada
      const computedStyle = window.getComputedStyle(element);
      const computedColor = computedStyle.color;
      const textElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'td', 'th', 'div', 'a', 'strong', 'b', 'em', 'i', 'label'];
      
      if (textElements.includes(tagName) || element.textContent?.trim()) {
        // Se tem classe de texto branco ou cinza claro, forçar preto
        if (classList.some(c => c.includes('text-white') || c.includes('text-gray-100') || 
                                c.includes('text-gray-200') || c.includes('text-gray-300') || 
                                c.includes('text-gray-400'))) {
          element.style.setProperty('color', '#000000', 'important');
        } 
        // Se tem classe de texto cinza médio, usar cinza escuro
        else if (classList.some(c => c.includes('text-gray-500'))) {
          element.style.setProperty('color', '#333333', 'important');
        }
        // Se tem classe de texto cinza escuro
        else if (classList.some(c => c.includes('text-gray-600'))) {
          element.style.setProperty('color', '#555555', 'important');
        }
        // Verificar cor computada - se for muito clara, forçar escura
        else if (computedColor) {
          // Extrair valores RGB
          const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            // Se qualquer canal RGB for > 200, é muito claro - forçar escuro
            if (r > 200 && g > 200 && b > 200) {
              element.style.setProperty('color', '#000000', 'important');
            }
            // Se estiver entre 150-200, usar cinza escuro
            else if (r > 150 && g > 150 && b > 150) {
              element.style.setProperty('color', '#333333', 'important');
            }
          }
        }
      }

      // SVGs - forçar cor escura
      if (tagName === 'svg') {
        element.style.setProperty('color', '#666666', 'important');
        element.style.setProperty('fill', '#666666', 'important');
        element.style.setProperty('stroke', '#666666', 'important');
      }

      // Badges
      if (classList.some(c => c.includes('Badge') || c.includes('badge'))) {
        element.style.setProperty('background', '#f5f5f5', 'important');
        element.style.setProperty('border-color', '#cccccc', 'important');
        element.style.setProperty('color', '#000000', 'important');
      }

      // Bordas - garantir que sejam visíveis
      const borderColor = window.getComputedStyle(element).borderColor;
      if (borderColor && (borderColor.includes('rgba(255') || borderColor.includes('rgb(255'))) {
        element.style.setProperty('border-color', '#dddddd', 'important');
      }

      // Remover gradientes de texto
      if (classList.some(c => c.includes('bg-clip-text') || c.includes('bg-gradient'))) {
        element.style.setProperty('-webkit-background-clip', 'unset', 'important');
        element.style.setProperty('background-clip', 'unset', 'important');
        element.style.setProperty('background', 'transparent', 'important');
        element.style.setProperty('color', '#000000', 'important');
      }

      // Processar filhos recursivamente
      Array.from(element.children).forEach(child => {
        applyPrintStyles(child as HTMLElement);
      });
    };

    // Adicionar classe de print
    content.classList.add('print-content');

    // Aplicar estilos inline
    applyPrintStyles(content);

    // Adicionar estilos CSS de impressão
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `
      @media print {
        @page {
          margin: 2cm;
          size: A4;
        }
        
        body * {
          visibility: hidden;
        }
        
        .print-content,
        .print-content * {
          visibility: visible !important;
        }
        
        .no-print,
        .no-print * {
          display: none !important;
          visibility: hidden !important;
        }
        
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: #ffffff !important;
        }
        
        .print-content .fixed,
        .print-content [class*="blur"],
        .print-content [class*="shadow"],
        .print-content [class*="gradient"],
        .print-content [class*="from-"],
        .print-content [class*="to-"],
        .print-content [class*="absolute"][class*="inset"] {
          display: none !important;
        }
        
        .print-content .grid {
          display: block !important;
        }
        
        .print-content .grid > * {
          margin-bottom: 1.5rem !important;
        }
        
        .print-content h1,
        .print-content h2,
        .print-content h3 {
          page-break-after: avoid !important;
        }
        
        .print-content section,
        .print-content [class*="Card"] {
          page-break-inside: avoid !important;
        }
        
        .print-content * {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    
    const existingStyle = document.getElementById('print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);

    // Aguardar antes de imprimir
    setTimeout(() => {
      window.print();
    }, 100);

    // Cleanup após impressão
    const cleanup = () => {
      // Remover estilos inline aplicados
      originalStyles.forEach((originalStyle, element) => {
        element.style.cssText = originalStyle;
      });
      originalStyles.clear();

      // Remover estilos CSS
      const styleEl = document.getElementById('print-styles');
      if (styleEl) {
        styleEl.remove();
      }
      
      // Remover classe
      content.classList.remove('print-content');
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
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

  if (!proposal) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center">Proposta não encontrada.</div>;
  }

  // Se precisa de senha e ainda não tem sessão válida
  if (showPasswordForm && !sessionToken) {
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
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none no-print">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">Atenção: Esta proposta expirou em {calculateValidUntil(proposal.created_at)}.</p>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-16"
        >
          {/* Header */}
          <motion.header variants={itemVariants} className="text-center space-y-6">
            <Badge variant="outline" className="border-neon-purple text-neon-purple px-4 py-1 text-sm uppercase tracking-widest">
              Proposta Comercial
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              {proposal.title || `Projeto para ${proposal.client_name}`}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Preparado especialmente para <span className="text-white font-semibold">{proposal.client_name}</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-4">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Calendar className="w-4 h-4 text-neon-purple" />
                <span>Criado em: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Clock className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-neon-green"}`} />
                <span className={isExpired ? "text-red-400" : ""}>Válido até: {calculateValidUntil(proposal.created_at)}</span>
              </div>
            </div>
          </motion.header>

          {/* Apresentação */}
          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Apresentação
                </h2>
                <div className="text-lg text-gray-300 leading-relaxed space-y-4">
                  <p>
                    Olá, tudo bem?
                  </p>
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

          {/* Objective */}
          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Objetivo do Projeto
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {proposal.objective}
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* Scope & Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scope */}
            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-purple/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-neon-purple" />
                    Escopo dos Serviços
                  </h2>
                  <ul className="space-y-4">
                    {proposal.scope?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300 group">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple group-hover:scale-150 transition-transform" />
                        <span className="group-hover:text-white transition-colors w-[95%]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            {/* Timeline */}
            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-green/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Clock className="w-6 h-6 text-neon-lime" />
                    Cronograma Estimado
                  </h2>
                  <div className="relative pl-6">
                    {/* Linha vertical contínua e discreta */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neon-lime" />
                    
                    <div className="space-y-8">
                      {proposal.timeline?.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isVisible ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: index * 0.1 }}
                          className="group relative"
                        >
                          <div className="flex items-start gap-4">
                            {/* Ponto da timeline */}
                            <div className="relative shrink-0">
                              <div className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full bg-border border border-neon-green/40 group-hover:border-neon-green transition-all duration-300 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-lime/50 group-hover:bg-neon-lime group-hover:scale-125 transition-all duration-300" />
                              </div>
                            </div>
                            
                            {/* Conteúdo */}
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
                  {proposal.delivery_date && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">Entrega prevista: <span className="text-white">{new Date(proposal.delivery_date).toLocaleDateString('pt-BR')}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          </div>

          {/* Investment */}
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
                      {formatCurrency(proposal.investment_value)}
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
                      {proposal.payment_methods?.map((method: string, idx: number) => (
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
                      {proposal.conditions?.map((condition: string, idx: number) => (
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

          {/* Política de Rescisão */}
          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10">
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-left group [&[data-state=open]>svg]:rotate-180">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-1 h-8 bg-neon-purple rounded-full" />
                      Política de Rescisão
                    </h2>
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 prose-hr:border-white/10 max-w-none">
                      <ReactMarkdown>
                        {proposal.rescision_policy || DEFAULT_RESCISION_POLICY}
                      </ReactMarkdown>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </motion.section>

          {/* CTA Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
            {!proposal.is_accepted && (
              <Button 
                size="lg" 
                className="bg-neon-purple hover:bg-neon-purple/90 text-white h-14 px-8 w-full sm:w-auto"
                onClick={() => {
                  // Passar o token da sessão via URL ou sessionStorage
                  if (sessionToken) {
                    sessionStorage.setItem(`proposal_session_${proposal.id}`, sessionToken);
                  }
                  setLocation(`/proposta/${id}/aceitar`);
                }}
              >
                <FileCheck className="mr-2 w-5 h-5" />
                Aceitar Proposta Eletronicamente
              </Button>
            )}
            {proposal.is_accepted && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Esta proposta já foi aceita eletronicamente.</span>
              </div>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="hidden border-white/20 text-white hover:bg-white/5 h-14 px-8 w-full sm:w-auto no-print"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 w-5 h-5" />
              Baixar PDF
            </Button>
          </motion.div>

          {/* Footer */}
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
    </div>
  );
}
