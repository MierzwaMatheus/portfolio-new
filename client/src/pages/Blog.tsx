import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

export default function Blog() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPost, setFeaturedPost] = useState<any>(null);

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
        // Find the first featured post, or default to the first post
        const featured = data.find((p: any) => p.featured) || data[0];
        setFeaturedPost(featured);

        // Filter out the featured post from the main list if it was found
        const otherPosts = data.filter((p: any) => p.id !== featured.id);
        setPosts(otherPosts);
      } else {
        setFeaturedPost(null);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setFeaturedPost(null);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        {featuredPost && (
          <motion.section variants={item} className="space-y-6">
            <h2 className="text-xl font-bold text-white">Em Destaque</h2>

            <Link href={`/blog/${featuredPost.slug}`}>
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/5 shadow-2xl h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
                <img
                  src={featuredPost.image || "https://via.placeholder.com/800x400"}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredPost.tags?.map((tag: string) => (
                      <Badge key={tag} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight max-w-4xl">
                    {featuredPost.title}
                  </h3>

                  <p className="text-gray-300 text-lg mb-6 max-w-3xl line-clamp-2">
                    {featuredPost.subtitle}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-400 space-x-4">
                      <span>{new Date(featuredPost.published_at).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.ceil(featuredPost.content.split(' ').length / 200)} min de leitura
                      </span>
                    </div>

                    <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                      Ler agora
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
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
          <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar por tags
          </Button>
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
