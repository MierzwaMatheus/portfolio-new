import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Code, 
  Terminal, 
  Cpu, 
  Palette, 
  Zap, 
  Layout as LayoutIcon, 
  MessageSquare,
  Quote
} from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for skeleton demonstration
    const timer = setTimeout(() => setIsLoading(false), 800);
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
        className="space-y-16 pb-12"
      >
        {/* Hero Section */}
        <motion.section variants={item} className="pt-8 md:pt-16">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-1.5 mb-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
              <Terminal className="w-3 h-3 text-neon-purple mr-2" />
              <p className="text-sm font-medium text-neon-purple font-mono">
                <span className="text-white mr-2">$</span>echo "Olá, Mundo!"
              </p>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-4">
              <span className="text-neon-purple">Oi!</span> Eu sou o <br />
              <span className="relative inline-block">
                Matheus
                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-neon-lime rounded-full"></span>
              </span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl mt-4 text-gray-400 font-light">
              Front-end Developer <span className="text-neon-purple">&</span> UI Designer
            </h2>
            
            <p className="max-w-2xl mt-8 text-gray-300 text-lg leading-relaxed border-l-2 border-neon-purple/50 pl-6">
              Apaixonado por construir experiências digitais elegantes que combinam código limpo e design excepcional.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-10">
            {[
              { name: "React", color: "bg-neon-lime" },
              { name: "TypeScript", color: "bg-neon-lime" },
              { name: "Tailwind CSS", color: "bg-neon-purple" },
              { name: "UI Design", color: "bg-neon-purple" }
            ].map((tech) => (
              <div key={tech.name} className="flex items-center px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group cursor-default">
                <span className={`inline-block w-2 h-2 rounded-full ${tech.color} mr-3 shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:scale-125 transition-transform`}></span>
                <span className="text-sm font-medium text-gray-200">{tech.name}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* About Section */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span> Sobre mim <span className="text-neon-purple ml-2">*/</span>
          </h2>
          
          <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code className="w-24 h-24 text-neon-purple" />
            </div>
            
            <div className="relative z-10 space-y-6 text-gray-300 leading-relaxed text-lg">
              <p>
                Sou um entusiasta de Front-End com mais de 4 anos de experiência como Líder Técnico e Desenvolvedor. 
                Minha paixão é transformar interfaces web complexas em experiências intuitivas e ágeis, utilizando 
                tecnologias como React, TypeScript e Inteligência Artificial.
              </p>
              <p>
                Tenho um histórico sólido na revitalização de UI/UX, criação de dashboards dinâmicos e desenvolvimento 
                de interfaces interativas para IAs e chatbots. Gosto de liderar equipes técnicas, promovendo inovações 
                no desenvolvimento, como a integração de ferramentas de IA (por exemplo, Cursor).
              </p>
            </div>
          </div>
        </motion.section>

        {/* Skills Grid */}
        <motion.section variants={item}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Desenvolvimento Front-end de Alta Performance",
                desc: "Minha paixão é dar vida a interfaces web complexas e responsivas, utilizando o poder de tecnologias como React e TypeScript para criar experiências de usuário fluidas, interativas e com performance otimizada.",
                icon: Zap,
                color: "text-neon-lime"
              },
              {
                title: "Liderança Técnica e Inovação em Front-end",
                desc: "Adoro guiar equipes de front-end, definindo arquiteturas robustas, implementando padrões de código eficientes e introduzindo fluxos de trabalho inovadores (incluindo ferramentas de IA!) para turbinar a produtividade.",
                icon: Terminal,
                color: "text-neon-lime"
              },
              {
                title: "UI/UX Design Focado na Experiência",
                desc: "Mergulho no universo do UI/UX para desenhar interfaces não apenas visualmente atraentes, mas incrivelmente intuitivas e eficientes, transformando requisitos de negócio em jornadas que os usuários realmente apreciam.",
                icon: LayoutIcon,
                color: "text-neon-lime"
              },
              {
                title: "Interfaces Inteligentes com IA",
                desc: "Sou um entusiasta da integração de Inteligência Artificial no front-end, criando desde interfaces interativas para chatbots e agentes de IA até utilizando ferramentas assistidas por IA para otimizar o desenvolvimento.",
                icon: Cpu,
                color: "text-neon-lime"
              }
            ].map((skill, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#1e1e1e] to-[#121212] p-8 rounded-xl border border-white/5 hover:border-neon-purple/30 transition-all duration-300 group hover:-translate-y-1">
                <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit group-hover:bg-neon-purple/10 transition-colors">
                  <skill.icon className={`w-6 h-6 ${skill.color}`} />
                </div>
                <h3 className={`font-bold text-lg ${skill.color} mb-3 group-hover:text-white transition-colors`}>{skill.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{skill.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section variants={item}>
          <h3 className="text-xl font-bold text-white mb-8 flex items-center">
            <MessageSquare className="w-5 h-5 text-neon-purple mr-3" />
            O que falam sobre mim
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Lucas",
                role: "CEO ForgeCode",
                img: "https://roxus-studio.web.app/assets/images/depoimentos/lucas.jpeg",
                text: "Obrigado Matheus pela modernização da nossa marca. Foi essencial essa reformulação! Superou as espectativas, trabalho rápido e muito eficiente. Nós da Forge Code agradecemos muito a atenção e os serviços prestados!"
              },
              {
                name: "Luiz Cossolin",
                role: "CEO Paith",
                img: "https://roxus-studio.web.app/assets/images/depoimentos/Luiz%20Cossolin.jpeg",
                text: "Valeu demais pelo trabalho! Desde o início, aprendi muito sobre identidade visual. A primeira chamada que tivemos esclareceu todas as dúvidas e permitiu explicar bem o que eu queria. O questionário é bastante completo, e o serviço de atendimento está em outro nível."
              },
              {
                name: "Fabio Oliveira",
                role: "CEO Sampa Invest Group",
                img: "https://roxus-studio.web.app/assets/images/cartoes/fabio-oliveira.jpeg",
                text: "Cara, a minha marca ficou top demais! Sério, eu fiquei impressionado com o que a Roxus conseguiu fazer. Eu já esperava algo legal, mas isso foi muito além! Com certeza vou recomendar para todos os meus amigos e colegas de trabalho."
              },
              {
                name: "Maria Cecilia",
                role: "CEO Aroma & Latte",
                img: "https://roxus-studio.web.app/assets/images/depoimentos/maria%20cecilia.jpg",
                text: "Quando iniciei o projeto não tinha certeza se era um bom investimento, agora já passaram 3 meses e nós percebemos um aumento de 30% no marketing orgânico da marca. A forma que a Roxus encaminhou o projeto fez os clientes se sentirem muito mais próximos da nossa marca."
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-[#1e1e1e] to-[#121212] p-6 rounded-xl border border-white/5 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5" />
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 mr-4">
                    <img src={testimonial.img} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-neon-purple">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm italic leading-relaxed">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </Layout>
  );
}
