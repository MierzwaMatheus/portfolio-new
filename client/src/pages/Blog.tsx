import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronRight, ChevronLeft, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Blog() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .schema('app_portfolio')
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Find all featured posts
        const featured = data.filter((p: any) => p.featured === true);
        setFeaturedPosts(featured || []);

        // Filter out all featured posts from the main list
        const featuredIds = featured.map((p: any) => p.id);
        const otherPosts = data.filter((p: any) => !featuredIds.includes(p.id));
        setPosts(otherPosts);
      } else {
        setFeaturedPosts([]);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setFeaturedPosts([]);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Coletar todas as tags únicas dos posts
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  const filteredPosts = posts.filter(post => {
    // Filtro por termo de busca
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro por tags selecionadas
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => post.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

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

        {/* Featured Posts Carousel */}
        {featuredPosts.length > 0 && (
          <motion.section variants={item} className="space-y-6">
            <h2 className="text-xl font-bold text-white">Em Destaque</h2>

            {featuredPosts.length === 1 ? (
              <Link href={`/blog/${featuredPosts[0].slug}`}>
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl h-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
                  <img
                    src={featuredPosts[0].image || "https://via.placeholder.com/800x400"}
                    alt={featuredPosts[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredPosts[0].tags?.map((tag: string) => (
                        <Badge key={tag} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-4xl">
                      {featuredPosts[0].title}
                    </h3>

                    <p className="text-gray-300 text-lg mb-6 max-w-3xl line-clamp-2">
                      {featuredPosts[0].subtitle}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-400 space-x-4">
                        <span>{new Date(featuredPosts[0].published_at).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {Math.ceil(featuredPosts[0].content.split(' ').length / 200)} min de leitura
                        </span>
                      </div>

                      <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                        Ler agora
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent className="-ml-2 md:-ml-4">
                  {featuredPosts.map((post) => (
                    <CarouselItem key={post.id} className="pl-2 md:pl-4 basis-full">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl h-[400px]">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
                          <img
                            src={post.image || "https://via.placeholder.com/800x400"}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags?.map((tag: string) => (
                                <Badge key={tag} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-4xl">
                              {post.title}
                            </h3>

                            <p className="text-gray-300 text-lg mb-6 max-w-3xl line-clamp-2">
                              {post.subtitle}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-400 space-x-4">
                                <span>{new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {Math.ceil(post.content.split(' ').length / 200)} min de leitura
                                </span>
                              </div>

                              <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                                Ler agora
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 border-white/20 bg-black/50 hover:bg-black/70 text-white hover:text-white" />
                <CarouselNext className="right-4 border-white/20 bg-black/50 hover:bg-black/70 text-white hover:text-white" />
              </Carousel>
            )}
          </motion.section>
        )}

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
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`border-white/10 text-gray-300 hover:text-white hover:bg-white/5 ${
                  selectedTags.length > 0 ? 'border-neon-purple/50 bg-neon-purple/10' : ''
                }`}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtrar por tags
                {selectedTags.length > 0 && (
                  <Badge className="ml-2 bg-neon-purple text-white border-none">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/95 border-white/10 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Filtrar por tags</h4>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearTagFilters}
                      className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allTags.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhuma tag disponível</p>
                  ) : (
                    allTags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 rounded-md p-2 transition-colors"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <Checkbox
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                          className="border-white/20 data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
                        />
                        <label className="text-sm text-gray-300 cursor-pointer flex-1">
                          {tag}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Posts Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-400 text-lg">Nenhum artigo publicado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">Volte em breve para conferir novos conteúdos!</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div
                className="group rounded-xl bg-card border border-white/5 overflow-hidden hover:border-neon-purple/30 transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                  <img
                    src={post.image || "https://via.placeholder.com/400x200"}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center text-xs text-gray-500 mb-3 space-x-3">
                    <span>{new Date(post.published_at).toLocaleDateString('pt-BR')}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                    <span>{Math.ceil(post.content.split(' ').length / 200)} min de leitura</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-purple transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                    {post.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags?.length > 3 && (
                      <Badge variant="secondary" className="bg-white/5 text-gray-300 border border-white/5 text-[10px]">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <span className="inline-flex items-center text-sm text-neon-purple hover:text-neon-lime transition-colors mt-auto">
                    Ler mais <ChevronRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
            ))
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
