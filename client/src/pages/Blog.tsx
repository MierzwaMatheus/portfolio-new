import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FEATURED_POST = {
  id: 1,
  title: "Economia de Plataformas e as Novas Dinâmicas do Trabalho Digital",
  excerpt: "Investigando as formas de trabalho mediadas por plataformas digitais, seus impactos nos direitos e as perspectivas de organização dos trabalhadores neste novo cenário.",
  date: "19 de março, 2025",
  readTime: "7 min de leitura",
  image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop",
  tags: ["Economia de Plataforma", "Trabalho Digital", "Condições de Trabalho"]
};

const POSTS = [
  {
    id: 2,
    title: "O Front-end na Era da Inteligência",
    excerpt: "Navegando a Revolução Semântica para Construir Experiências Superiores",
    date: "15 de junho, 2025",
    readTime: "45 min de leitura",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
    tags: ["Inteligência Artificial", "Web3", "Futuro do Trabalho", "Ética na Tecnologia", "Soberania Digital", "Acessibilidade"]
  },
  {
    id: 3,
    title: "Open Source",
    excerpt: "A Utopia Colaborativa Que o Capitalismo Tenta Cooptar",
    date: "12 de junho, 2025",
    readTime: "19 min de leitura",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
    tags: ["Open Source", "Tecnologia e Sociedade", "React", "Forças Produtivas", "Futuro do Trabalho", "Economia de Plataforma", "Ética na Tecnologia"]
  },
  {
    id: 4,
    title: "O Manifesto do Desenvolvedor",
    excerpt: "Reivindicando o Software Livre Como Ferramenta de Emancipação",
    date: "4 de junho, 2025",
    readTime: "26 min de leitura",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2670&auto=format&fit=crop",
    tags: ["Filosofia", "Software Livre", "Carreira"]
  },
  {
    id: 5,
    title: "Engenheiros da Liberdade ou Arquitetos da Prisão?",
    excerpt: "O Papel Ético do Desenvolvedor na Construção do Futuro Digital",
    date: "31 de maio, 2025",
    readTime: "22 min de leitura",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop",
    tags: ["Ética", "Privacidade", "Sociedade"]
  }
];

export default function Blog() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Blog</h1>
          <p className="text-gray-400">Compartilhando conhecimento sobre desenvolvimento e design</p>
        </header>

        {/* Featured Post */}
        <motion.section variants={item} className="space-y-6">
          <h2 className="text-xl font-bold text-white">Em Destaque</h2>
          
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
            <img 
              src={FEATURED_POST.image} 
              alt={FEATURED_POST.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <div className="flex flex-wrap gap-2 mb-4">
                {FEATURED_POST.tags.map(tag => (
                  <Badge key={tag} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-4xl">
                {FEATURED_POST.title}
              </h3>
              
              <p className="text-gray-300 text-lg mb-6 max-w-3xl line-clamp-2">
                {FEATURED_POST.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                  <span>{FEATURED_POST.date}</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {FEATURED_POST.readTime}
                  </span>
                </div>
                
                <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                  Ler agora
                </Button>
              </div>
            </div>

            {/* Carousel Navigation (Visual Only) */}
            <div className="absolute top-1/2 left-4 z-30 -translate-y-1/2">
              <Button size="icon" variant="ghost" className="rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
              <Button size="icon" variant="ghost" className="rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm">
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === 0 ? 'w-6 bg-neon-purple' : 'w-1.5 bg-white/30'}`}
                ></div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Search and Filter */}
        <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Buscar artigos..." 
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-neon-purple/50 focus:ring-neon-purple/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar por tags
          </Button>
        </motion.div>

        {/* Posts Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {POSTS.map((post) => (
            <div 
              key={post.id}
              className="group rounded-xl bg-card border border-white/5 overflow-hidden hover:border-neon-purple/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center text-xs text-gray-500 mb-3 space-x-3">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-purple transition-colors">
                  {post.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="secondary" className="bg-white/5 text-gray-300 border border-white/5 text-[10px]">
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <a href="#" className="inline-flex items-center text-sm text-neon-purple hover:text-neon-lime transition-colors mt-auto">
                  Ler mais <ChevronRight className="ml-1 w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
