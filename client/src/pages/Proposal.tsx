import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar, DollarSign, ArrowRight, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock Data for Proposal
const PROPOSAL_DATA = {
  client: "Aurora Tecnologia",
  title: "Desenvolvimento de Plataforma SaaS",
  date: "17/06/2025",
  validUntil: "27/06/2025",
  objective: "Desenvolver uma plataforma SaaS escalável e intuitiva para gestão de processos internos, focada em automação e análise de dados em tempo real.",
  scope: [
    "Desenvolvimento Frontend com React e Tailwind CSS",
    "Integração com API RESTful",
    "Dashboard interativo com gráficos em tempo real",
    "Sistema de autenticação e gestão de usuários",
    "Otimização de performance e SEO",
    "Testes automatizados e documentação técnica"
  ],
  timeline: [
    { step: "Planejamento e Design", period: "2 semanas" },
    { step: "Desenvolvimento Frontend", period: "4 semanas" },
    { step: "Integração Backend", period: "3 semanas" },
    { step: "Testes e QA", period: "2 semanas" },
    { step: "Deploy e Treinamento", period: "1 semana" }
  ],
  investment: "R$ 18.500,00",
  paymentMethods: [
    "50% no início / 50% na entrega",
    "Parcelado em até 3x (sem juros)"
  ],
  conditions: [
    "Revisões: até 2 rodadas incluídas por etapa.",
    "Garantia: correções de falhas por até 30 dias após entrega.",
    "Suporte: incluso durante o projeto."
  ]
};

export default function Proposal() {
  const { id } = useParams();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      transition: { type: "spring", stiffness: 50 }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon-purple selection:text-white overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <motion.div 
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-16"
        >
          {/* Header */}
          <motion.header variants={itemVariants} className="text-center space-y-6">
            <Badge variant="outline" className="border-neon-purple text-neon-purple px-4 py-1 text-sm uppercase tracking-widest">
              Proposta Comercial #{id || "001"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              {PROPOSAL_DATA.title}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Preparado especialmente para <span className="text-white font-semibold">{PROPOSAL_DATA.client}</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-4">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Calendar className="w-4 h-4 text-neon-purple" />
                <span>Criado em: {PROPOSAL_DATA.date}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-neon-green" />
                <span>Válido até: {PROPOSAL_DATA.validUntil}</span>
              </div>
            </div>
          </motion.header>

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
                  {PROPOSAL_DATA.objective}
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
                    {PROPOSAL_DATA.scope.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300 group">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple group-hover:scale-150 transition-transform" />
                        <span className="group-hover:text-white transition-colors">{item}</span>
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
                    <Clock className="w-6 h-6 text-neon-green" />
                    Cronograma Estimado
                  </h2>
                  <div className="space-y-6 relative pl-2">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10" />
                    
                    {PROPOSAL_DATA.timeline.map((item, index) => (
                      <div key={index} className="relative flex items-center gap-4 pl-6 group">
                        <div className="absolute left-0 w-6 h-6 rounded-full bg-black border-2 border-white/20 flex items-center justify-center z-10 group-hover:border-neon-green transition-colors">
                          <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-neon-green transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium group-hover:text-neon-green transition-colors">{item.step}</h4>
                          <p className="text-sm text-gray-500">{item.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      {PROPOSAL_DATA.investment}
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
                      {PROPOSAL_DATA.paymentMethods.map((method, idx) => (
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
                      {PROPOSAL_DATA.conditions.map((condition, idx) => (
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

          {/* CTA Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
            <Button size="lg" className="bg-neon-purple hover:bg-neon-purple/90 text-white px-8 h-14 text-lg shadow-lg shadow-neon-purple/20 w-full sm:w-auto group">
              Aceitar Proposta
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-14 px-8 w-full sm:w-auto">
              <Download className="mr-2 w-5 h-5" />
              Baixar PDF
            </Button>
            <Button size="lg" variant="ghost" className="text-gray-400 hover:text-white h-14 px-8 w-full sm:w-auto">
              <Share2 className="mr-2 w-5 h-5" />
              Compartilhar
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
