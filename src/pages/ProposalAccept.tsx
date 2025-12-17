import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, FileText, Scale, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";

export default function ProposalAccept() {
  const { slug } = useParams();
  const [location, setLocation] = useLocation();
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  // Form data
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [clientDeclaration, setClientDeclaration] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProposal();
    }
  }, [slug]);

  const fetchProposal = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .schema('app_portfolio')
        .from('proposals')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (data) {
        setProposal(data);
        
        // Tentar recuperar token da sessão do sessionStorage
        const storedToken = sessionStorage.getItem(`proposal_session_${data.id}`);
        if (storedToken) {
          setSessionToken(storedToken);
        } else {
          // Se não tem token e não tem senha, criar sessão automaticamente
          if (!data.password) {
            await createSession(data.id);
          } else {
            // Se tem senha mas não tem token, redirecionar para página de visualização
            toast.error("Acesso não autorizado. Por favor, acesse a proposta primeiro.");
            setTimeout(() => {
              setLocation(`/proposta/${slug}`);
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching proposal:", error);
      toast.error("Erro ao carregar proposta");
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (proposalId: string) => {
    try {
      // Obter IP e User-Agent do cliente
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('create_proposal_session', {
        p_proposal_id: proposalId,
        p_password: null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        throw error;
      } else {
        setSessionToken(data);
        sessionStorage.setItem(`proposal_session_${proposalId}`, data);
      }
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.message || "Erro ao criar sessão");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDocument = (doc: string) => {
    // Remove caracteres não numéricos
    const numbers = doc.replace(/\D/g, '');
    
    // CPF: 11 dígitos
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // CNPJ: 14 dígitos
    if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return doc;
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocument(value);
    setClientDocument(formatted);
  };

  const handleAccept = async () => {
    if (!sessionToken || !proposal) {
      toast.error("Sessão inválida");
      return;
    }

    // Validações
    if (!clientName.trim()) {
      toast.error("Preencha o nome completo");
      return;
    }

    if (!clientDocument.trim()) {
      toast.error("Preencha o CPF ou CNPJ");
      return;
    }

    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast.error("Preencha um e-mail válido");
      return;
    }

    if (!hasConsent) {
      toast.error("Você deve concordar com os termos para aceitar a proposta");
      return;
    }

    setIsSubmitting(true);

    try {
      // Obter IP e User-Agent
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);
      
      const userAgent = navigator.userAgent;

      const { data, error } = await supabase.rpc('register_proposal_acceptance', {
        p_session_token: sessionToken,
        p_client_name: clientName.trim(),
        p_client_document: clientDocument.replace(/\D/g, ''),
        p_client_email: clientEmail.trim(),
        p_client_role: clientRole.trim() || null,
        p_client_declaration: clientDeclaration.trim() || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        if (error.message.includes('já foi aceita')) {
          toast.error("Esta proposta já foi aceita anteriormente");
        } else if (error.message.includes('Sessão inválida')) {
          toast.error("Sessão expirada. Por favor, recarregue a página");
        } else {
          throw error;
        }
      } else {
        toast.success("Proposta aceita com sucesso!");
        setTimeout(() => {
          setLocation(`/proposta/${slug}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error accepting proposal:", error);
      toast.error(error.message || "Erro ao aceitar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
          <p>Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-gray-400">A proposta solicitada não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  // Se não tem sessão válida, mostrar erro
  if (!isLoading && !sessionToken) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acesso Não Autorizado</h1>
            <p className="text-gray-400 mb-4">
              Você precisa acessar a proposta primeiro antes de aceitá-la.
            </p>
            <Button 
              onClick={() => setLocation(`/proposta/${slug}`)}
              className="bg-neon-purple hover:bg-neon-purple/90"
            >
              Voltar para Proposta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-neon-purple mb-4">
              <Scale className="w-6 h-6" />
              <h1 className="text-3xl font-bold">Aceite Eletrônico de Proposta</h1>
            </div>
            <p className="text-xl text-gray-400">
              Proposta: <span className="text-white font-semibold">{proposal.title || `Projeto para ${proposal.client_name}`}</span>
            </p>
          </div>

          {/* Cláusula de Aceite Eletrônico */}
          <Card className="bg-card/50 backdrop-blur-sm border-neon-purple/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-neon-purple mt-1 shrink-0" />
                <div>
                  <h2 className="text-lg font-bold mb-2">Cláusula de Aceite Eletrônico</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-neon-purple" />
                Dados para Aceite
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nome Completo *</Label>
                  <Input
                    id="clientName"
                    className="bg-background border-input mt-1"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientDocument">CPF ou CNPJ *</Label>
                  <Input
                    id="clientDocument"
                    className="bg-background border-input mt-1"
                    value={clientDocument}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">E-mail *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    className="bg-background border-input mt-1"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientRole">Cargo/Função (Opcional, B2B)</Label>
                  <Input
                    id="clientRole"
                    className="bg-background border-input mt-1"
                    value={clientRole}
                    onChange={(e) => setClientRole(e.target.value)}
                    placeholder="Ex: Diretor, Gerente, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientDeclaration">Declaração de Poderes para Contratar (se Pessoa Jurídica)</Label>
                <Textarea
                  id="clientDeclaration"
                  className="bg-background border-input mt-1"
                  rows={3}
                  value={clientDeclaration}
                  onChange={(e) => setClientDeclaration(e.target.value)}
                  placeholder="Declare que possui poderes para representar a empresa e celebrar este contrato..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo da Proposta */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Resumo da Proposta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Cliente:</span>
                  <span className="ml-2 text-white">{proposal.client_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Valor Total:</span>
                  <span className="ml-2 text-white font-bold">{formatCurrency(proposal.investment_value)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-400">Objetivo:</span>
                  <p className="mt-1 text-white">{proposal.objective}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Política de Rescisão */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="w-full flex items-center justify-between text-left group [&[data-state=open]>svg]:rotate-180">
                  <h2 className="text-xl font-bold">Política de Rescisão</h2>
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

          {/* Foro */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-2">Foro</h2>
              <p className="text-gray-300">
                Fica eleito o foro da comarca de Itapevi – SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
            </CardContent>
          </Card>

          {/* Checkbox de Consentimento */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={hasConsent}
                  onCheckedChange={(checked) => setHasConsent(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-base cursor-pointer">
                  Li e concordo com todos os termos desta proposta, incluindo escopo, valores, prazos, condições gerais e política de rescisão.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Aceite */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-neon-purple hover:bg-neon-purple/90 text-white px-12 py-6 text-lg"
              onClick={handleAccept}
              disabled={!hasConsent || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Aceitar Proposta
                </>
              )}
            </Button>
          </div>

          {/* Aviso Legal */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Ao aceitar esta proposta, você está celebrando um contrato válido e vinculante.
              Todas as informações fornecidas e o momento do aceite serão registrados para fins de comprovação.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

