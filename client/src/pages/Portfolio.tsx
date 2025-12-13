import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, ExternalLink, Github, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Mock data based on provided content
const PROJECTS = [
  {
    id: 1,
    title: "Tucano - Organize suas finanças",
    description: "Tucano é uma aplicação mobile-first, moderna e acessível que integra gestão de listas de compras mensais e controle financeiro pessoal.",
    longDescription: "Tucano é uma aplicação mobile-first, moderna e acessível que integra gestão de listas de compras mensais e controle financeiro pessoal. O projeto foca em usabilidade e performance em dispositivos móveis.",
    image: "https://i.postimg.cc/kMLz6myM/img0.png",
    images: [
      "https://i.postimg.cc/kMLz6myM/img0.png",
      "https://i.postimg.cc/kMLz6myM/img0.png" // Placeholder for more images
    ],
    tags: ["React", "TypeScript", "Tailwind CSS", "Vite", "Firebase"],
    links: {
      demo: "#",
      github: "#"
    }
  },
  {
    id: 2,
    title: "Roxus Studio - Landing Page",
    description: "Landing page institucional para estúdio de design e desenvolvimento, com foco em conversão e apresentação de portfólio.",
    longDescription: "Landing page institucional desenvolvida para a Roxus Studio. O projeto apresenta os serviços, portfólio e depoimentos de clientes, com um design moderno e animações fluidas para engajar os visitantes.",
    image: "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg", // Placeholder
    images: [
      "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg"
    ],
    tags: ["React", "Tailwind CSS", "Framer Motion"],
    links: {
      demo: "https://roxus-studio.web.app/",
      github: "#"
    }
  },
  {
    id: 3,
    title: "Dashboard Administrativo",
    description: "Interface administrativa completa com gráficos dinâmicos, gestão de usuários e relatórios em tempo real.",
    longDescription: "Dashboard administrativo desenvolvido para gestão interna. Inclui visualização de dados com gráficos interativos, tabelas de dados com filtros avançados e sistema de permissões de usuário.",
    image: "https://i.postimg.cc/kMLz6myM/img0.png", // Placeholder
    images: [
      "https://i.postimg.cc/kMLz6myM/img0.png"
    ],
    tags: ["React", "TypeScript", "Recharts", "Radix UI"],
    links: {
      demo: "#",
      github: "#"
    }
  },
  {
    id: 4,
    title: "E-commerce de Moda",
    description: "Plataforma de comércio eletrônico com carrinho de compras, checkout e integração com gateway de pagamento.",
    longDescription: "E-commerce completo focado no nicho de moda. Possui catálogo de produtos com filtros, carrinho de compras persistente, checkout otimizado e integração com Stripe para pagamentos.",
    image: "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg", // Placeholder
    images: [
      "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg"
    ],
    tags: ["Next.js", "Stripe", "Tailwind CSS"],
    links: {
      demo: "#",
      github: "#"
    }
  }
];

const FILTERS = [
  "Todos", "React", "TypeScript", "Tailwind CSS", "Vite", "Firebase", "Next.js"
];

export default function Portfolio() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[0] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredProjects = activeFilter === "Todos" 
    ? PROJECTS 
    : PROJECTS.filter(p => p.tags.includes(activeFilter));

  if (isLoading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 pb-12"
      >
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white">Portfólio</h1>
          <p className="text-gray-400 mt-2">Uma seleção dos meus trabalhos recentes</p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300
                ${activeFilter === filter 
                  ? "bg-neon-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"}
              `}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group rounded-xl bg-card border border-white/5 overflow-hidden hover:border-neon-purple/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-purple transition-colors">{project.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-white/5 hover:bg-neon-purple hover:text-white text-white border border-white/10 transition-all duration-300 group-hover:border-neon-purple/50"
                        onClick={() => setSelectedProject(project)}
                      >
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden">
                      <VisuallyHidden>
                        <DialogTitle>{project.title}</DialogTitle>
                      </VisuallyHidden>
                      <div className="grid grid-cols-1 lg:grid-cols-5 h-full max-h-[90vh] overflow-y-auto lg:overflow-hidden">
                        {/* Carousel Section */}
                        <div className="lg:col-span-3 bg-black/50 p-6 flex items-center justify-center relative min-h-[300px]">
                          <Carousel className="w-full max-w-md mx-auto">
                            <CarouselContent>
                              {project.images.map((img, idx) => (
                                <CarouselItem key={idx}>
                                  <div className="aspect-video rounded-lg overflow-hidden border border-white/10 relative group/carousel">
                                    <img src={img} alt={`${project.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 bg-black/50 border-white/10 text-white hover:bg-neon-purple hover:border-neon-purple" />
                            <CarouselNext className="right-2 bg-black/50 border-white/10 text-white hover:bg-neon-purple hover:border-neon-purple" />
                          </Carousel>
                        </div>
                        
                        {/* Details Section */}
                        <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col h-full overflow-y-auto bg-[#0f0f0f]">
                          <DialogHeader className="mb-6">
                            <div className="text-2xl font-bold text-white mb-2">{project.title}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {project.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="bg-neon-purple/10 text-neon-purple border-neon-purple/20 hover:bg-neon-purple/20">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </DialogHeader>
                          
                          <DialogDescription className="text-gray-300 text-base leading-relaxed mb-8">
                            {project.longDescription}
                          </DialogDescription>
                          
                          <div className="mt-auto space-y-3">
                            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Links do Projeto</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <a href={project.links.demo} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full bg-neon-purple hover:bg-neon-purple/80 text-white">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Live Demo
                                </Button>
                              </a>
                              <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white">
                                  <Github className="mr-2 h-4 w-4" />
                                  Código
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </Layout>
  );
}
