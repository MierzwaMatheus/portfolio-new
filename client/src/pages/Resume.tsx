import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Code, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Resume() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12 pb-12"
      >
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Currículo</h1>
            <p className="text-gray-400 mt-2">Minha trajetória profissional e habilidades técnicas</p>
          </div>
          <a 
            href="/archives/CV - Matheus Mierzwa.pdf" 
            download="CV - Matheus Mierzwa.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white border-none">
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {/* Experience Section */}
            <motion.section variants={item}>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center flex-wrap font-mono">
                <span className="text-neon-purple mr-2">/*</span>Experiência Profissional<span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="space-y-6">
                <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient overflow-hidden border border-white/5 group hover:border-neon-purple/30 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-neon-purple" />
                        Líder Técnico de Front-End
                      </h3>
                      <span className="text-sm text-neon-lime font-mono bg-neon-lime/10 px-2 py-1 rounded">Jan-2025 - Atual</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 font-medium">InBot</div>
                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2 marker:text-neon-purple">
                        <li>Liderança técnica da equipe de front-end (2 colaboradores), definindo arquiteturas, padrões de código e melhores práticas, resultando em uma <strong className="text-white">redução de 25% no retrabalho</strong>.</li>
                        <li>Implementação de fluxo de trabalho <strong className="text-white">100% integrado</strong> com a ferramenta Cursor, <strong className="text-white">aumentando a produtividade da equipe em 40%</strong> na entrega de novas features.</li>
                        <li>Concepção e desenvolvimento da interface para um agente de IA que configura campanhas de WhatsApp via linguagem natural, <strong className="text-white">reduzindo em 80% o tempo de configuração</strong> manual.</li>
                        <li>Criação de um sistema de BI com geração dinâmica de gráficos (baseado em <strong className="text-white">estrutura JSON proprietária</strong>), permitindo a visualização de dados em tempo real e <strong className="text-white">reduzindo em 40% o tempo para geração de relatórios</strong>.</li>
                        <li>Gerenciamento do desenvolvimento da interface externa interativa ("cidade animada") com agentes de IA clicáveis, utilizando React e técnicas de animação CSS/JS.</li>
                        <li>Colaboração direta com equipes de produto e back-end para definição de requisitos e integração de APIs.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient overflow-hidden border border-white/5 group hover:border-neon-purple/30 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Code className="w-4 h-4 mr-2 text-neon-purple" />
                        Programador Front-End e UI Designer
                      </h3>
                      <span className="text-sm text-neon-lime font-mono bg-neon-lime/10 px-2 py-1 rounded">2024 - Jan-2025</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 font-medium">InBot</div>
                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2 marker:text-neon-purple">
                        <li>Revitalização completa das interfaces da plataforma administrativa e de clientes utilizando JS Puro (por solicitação), resultando em uma <strong className="text-white">melhoria de 30% na usabilidade percebida</strong> (feedback de usuários).</li>
                        <li><strong className="text-white">Criação de um novo padrão visual</strong> e guia de estilo para a plataforma, garantindo consistência e escalabilidade do design.</li>
                        <li>Implementação de soluções de programação utilizando IA para automação de tarefas internas de desenvolvimento, <strong className="text-white">otimizando o tempo de codificação em 40%</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient overflow-hidden border border-white/5 group hover:border-neon-purple/30 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Code className="w-4 h-4 mr-2 text-neon-purple" />
                        Programador Front-End e UI/UX Designer
                      </h3>
                      <span className="text-sm text-neon-lime font-mono bg-neon-lime/10 px-2 py-1 rounded">2022 - 2024</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 font-medium">Roxus Studio</div>
                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2 marker:text-neon-purple">
                        <li>Desenvolvimento de diversas landing pages e plataformas corporativas, contribuindo para um <strong className="text-white">aumento médio de 20% na taxa de conversão</strong> dos clientes.</li>
                        <li>Gerenciamento de projetos de front-end ponta a ponta, desde o briefing até a entrega final, mantendo um <strong className="text-white">índice de satisfação do cliente acima de 90%</strong>.</li>
                        <li>Implementação de bibliotecas de componentes reutilizáveis em TypeScript, <strong className="text-white">acelerando o desenvolvimento de novos projetos em 25%</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Education Section */}
            <motion.section variants={item}>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center flex-wrap font-mono">
                <span className="text-neon-purple mr-2">/*</span>Formação Acadêmica<span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="space-y-6">
                <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient overflow-hidden border border-white/5 group hover:border-neon-purple/30 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-neon-purple" />
                        Técnologo em Gestão de TI
                      </h3>
                      <span className="text-sm text-neon-lime font-mono bg-neon-lime/10 px-2 py-1 rounded">2020 - 2023</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2 font-medium">Fatec de Barueri</div>
                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2 marker:text-neon-purple">
                        <li>Formação com foco em governança de TI, segurança da informação e alinhamento estratégico entre tecnologia e objetivos de negócios.</li>
                        <li>Desenvolvimento de habilidades críticas para liderança técnica de equipes, gerenciamento de projetos de TI e integração de soluções inovadoras.</li>
                        <li>Resultados relevantes:
                          <ul className="list-circle pl-5 mt-1 space-y-1 text-gray-400">
                            <li>Editor-chefe do blog de tecnologia Retec, liderando projetos de comunicação técnica.</li>
                            <li>Nota máxima no TCC, com projeto para conectar ONGs de resgate animal a adotantes interessados.</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient overflow-hidden border border-white/5 group hover:border-neon-purple/30 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2 text-neon-purple" />
                        Técnico em Administração
                      </h3>
                      <span className="text-sm text-neon-lime font-mono bg-neon-lime/10 px-2 py-1 rounded">2015 - 2017</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2 font-medium">Etec de Barueri</div>
                    <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
                      <ul className="list-disc pl-5 space-y-2 marker:text-neon-purple">
                        <li>Base sólida em princípios de gestão organizacional, planejamento estratégico, e gerenciamento de recursos e operações.</li>
                        <li>Fortalecimento de capacidades analíticas e de organização de projetos, aplicáveis à gestão de times e desenvolvimento de produtos digitais.</li>
                        <li>Destaques:
                          <ul className="list-circle pl-5 mt-1 space-y-1 text-gray-400">
                            <li>Aprofundamento em fundamentos de economia e mercado, com aplicação prática no suporte à tomada de decisões estratégicas.</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Sidebar Skills */}
          <motion.div variants={item} className="space-y-8">
            
            {/* Habilidades */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                Habilidades
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient border border-white/5 p-6 space-y-6">
                {[
                  { name: "Cursor IDE", level: 90 },
                  { name: "React.js", level: 90 },
                  { name: "TypeScript", level: 90 },
                  { name: "Tailwind CSS", level: 90 },
                  { name: "Vite", level: 85 },
                  { name: "Bootstrap", level: 90 },
                  { name: "Git", level: 75 },
                  { name: "Figma", level: 90 },
                  { name: "React Native", level: 35 },
                  { name: "Expo", level: 35 },
                  { name: "DB NoSQL", level: 75 },
                  { name: "HTML5", level: 95 },
                  { name: "JavaScript (ES6+)", level: 85 },
                  { name: "CSS3", level: 95 },
                  { name: "Next.JS", level: 75 },
                  { name: "Vercel", level: 85 },
                ].map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">{skill.name}</span>
                      <span className="text-gray-500 font-mono">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-1.5 bg-white/10" indicatorClassName="bg-gradient-to-r from-neon-purple to-neon-lime" />
                  </div>
                ))}
              </div>
            </section>

            {/* Soft Skills */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                Soft Skills
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient border border-white/5 p-6">
                <div className="flex flex-wrap gap-2">
                  {[
                    "Liderança", "Comunicação", "Trabalho em Equipe", 
                    "Solução de Problemas", "Rápido Aprendizado", 
                    "Criatividade", "Autogestão", "Comprometimento"
                  ].map((skill) => (
                    <Badge key={skill} variant="outline" className="bg-neon-purple/10 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/20 transition-colors">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>

            {/* Cursos */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                Cursos
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient border border-white/5 p-6">
                <ul className="space-y-4">
                  {[
                    "RYLA (Treinamento de Liderança) - Rotary Club",
                    "NLW Together - Trilha ReactJS - Rocketseat",
                    "NLW Heat - Trilha Origin - Rocketseat",
                    "NLW Return - Trilha Origin - Rocketseat",
                    "Programação para internet com JS - DIO",
                    "ChatGPT - Do Zero ao Avançado - Udemy",
                    "IT Essentials",
                    "Brandy - Design Academy",
                    "Ilustrator PRO - Design Academy",
                    "Branding - Construção de Marca - GINEAD",
                    "Estratégia de Comercialização - GINEAD",
                    "Prevenção a Fraude - Bradesco",
                    "Atendimento ao cliente - Bradesco"
                  ].map((course, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-300">
                      <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-neon-lime flex-shrink-0"></span>
                      <span>{course}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Idiomas */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                Idiomas
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient border border-white/5 p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Português</span>
                  <span className="text-neon-lime font-mono text-xs">Nativo</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Inglês</span>
                  <span className="text-neon-lime font-mono text-xs">Avançado</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Espanhol</span>
                  <span className="text-neon-lime font-mono text-xs">Intermediário</span>
                </div>
              </div>
            </section>

            {/* Voluntariado */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                Voluntariado
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              
              <div className="rounded-lg bg-card text-card-foreground shadow-sm card-gradient border border-white/5 p-6">
                <ul className="space-y-4">
                  <li className="flex items-start text-sm text-gray-300">
                    <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-neon-lime flex-shrink-0"></span>
                    <div>
                      <span className="block font-medium text-white">Diretor de Imagem Pública</span>
                      <span className="text-xs text-gray-500">Rotaract Club Barueri • Gestão 2019-2020</span>
                    </div>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-neon-lime flex-shrink-0"></span>
                    <span>Participação em projeto de plantio de mais de 1000 árvores na baixada santista</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-300">
                    <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-neon-lime flex-shrink-0"></span>
                    <span>Professor em projeto de inclusão digital para idosos</span>
                  </li>
                </ul>
              </div>
            </section>

          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
