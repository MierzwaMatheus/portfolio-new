import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronRight, ChevronLeft, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "wouter";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Blog() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Preload da primeira imagem crítica (featured post)
  useEffect(() => {
    if (featuredPosts.length > 0 && featuredPosts[0]?.image) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = featuredPosts[0].image;
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [featuredPosts]);

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
    return <PageSkeleton />;
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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      <header className="space-y-4">
        <h1 className="text-3xl font-bold font-display text-text-primary uppercase tracking-tight">{t('blog.title')}</h1>
        <p className="text-text-secondary font-mono text-sm">{t('blog.subtitle')}</p>
      </header>

      {/* Featured Posts Carousel */}
      {featuredPosts.length > 0 && (
        <motion.section variants={item} className="space-y-6">
          <h2 className="text-sm font-bold text-text-muted flex items-center mb-4 font-mono uppercase tracking-widest">
            <span className="text-accent-green mr-2">&gt;</span> {t('blog.featured')}
          </h2>

          {featuredPosts.length === 1 ? (
            <Link href={`/blog/${featuredPosts[0].slug}`}>
              <div className="relative rounded-[6px] overflow-hidden group cursor-pointer border border-border-default h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                <img
                  src={featuredPosts[0].image || "https://via.placeholder.com/800x400"}
                  alt={featuredPosts[0].title}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="800"
                  height="400"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredPosts[0].tags?.map((tag: string) => (
                      <Badge key={tag} className="bg-surface-elevated/50 hover:bg-surface-elevated/80 text-text-secondary border border-border-subtle backdrop-blur-sm rounded-[3px] font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h3 className="text-2xl md:text-4xl font-bold font-display text-text-primary mb-4 leading-tight max-w-4xl group-hover:text-accent-purple transition-colors">
                    {featuredPosts[0].title}
                  </h3>

                  <p className="text-text-secondary text-sm md:text-base font-mono mb-6 max-w-3xl line-clamp-2">
                    {featuredPosts[0].subtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-subtle pt-6">
                    <div className="flex items-center text-[10px] text-text-muted space-x-4 font-mono uppercase tracking-widest pl-2 border-l-2 border-accent-purple h-full">
                      <span>{new Date(featuredPosts[0].published_at).toLocaleDateString()}</span>
                      <span className="flex items-center text-accent-green">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.ceil(featuredPosts[0].content.split(' ').length / 200)}m RUNTIME
                      </span>
                    </div>

                    <Button className="bg-surface-elevated hover:bg-accent-green hover:text-[#0A0A0A] text-text-primary border border-border-default transition-all duration-300 font-mono text-xs uppercase tracking-wider rounded-[4px] self-start sm:self-auto">
                      {t('blog.readNow')}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Carousel className="w-full" opts={{ loop: true }}>
              <CarouselContent className="">
                {featuredPosts.map((post, index) => (
                  <CarouselItem key={post.id} className="basis-full">
                    <Link href={`/blog/${post.slug}`}>
                      <div className="relative rounded-[6px] overflow-hidden group cursor-pointer border border-border-default h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                        <img
                          src={post.image || "https://via.placeholder.com/800x400"}
                          alt={post.title}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                          decoding="async"
                          width="800"
                          height="400"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags?.map((tag: string) => (
                              <Badge key={tag} className="bg-surface-elevated/50 hover:bg-surface-elevated/80 text-text-secondary border border-border-subtle backdrop-blur-sm rounded-[3px] font-mono text-[10px] uppercase tracking-widest px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold font-display text-text-primary mb-4 leading-tight max-w-3xl group-hover:text-accent-purple transition-colors">
                            {post.title}
                          </h3>

                          <p className="text-text-secondary text-sm font-mono mb-6 max-w-2xl line-clamp-2">
                            {post.subtitle}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-subtle pt-6">
                            <div className="flex items-center text-[10px] text-text-muted space-x-4 font-mono uppercase tracking-widest pl-2 border-l-2 border-accent-purple h-full">
                              <span>{new Date(post.published_at).toLocaleDateString()}</span>
                              <span className="flex items-center text-accent-green">
                                <Clock className="w-3 h-3 mr-1" />
                                {Math.ceil(post.content.split(' ').length / 200)}m RUNTIME
                              </span>
                            </div>

                            <Button className="bg-surface-elevated hover:bg-accent-green hover:text-[#0A0A0A] text-text-primary border border-border-default transition-all duration-300 font-mono text-xs uppercase tracking-wider rounded-[4px] self-start sm:self-auto">
                              {t('blog.readNow')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple rounded-[4px]" />
              <CarouselNext className="right-4 bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary hover:bg-accent-purple hover:border-accent-purple rounded-[4px]" />
            </Carousel>
          )}
        </motion.section>
      )}

      {/* Search and Filter */}
      <motion.div variants={item} className="flex flex-col md:flex-row gap-4 mb-2 border-b border-border-default pb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder={t('blog.searchPlaceholder')}
            className="pl-11 h-10 bg-surface-card border-border-default text-text-primary placeholder:text-text-muted font-mono focus-visible:ring-1 focus-visible:ring-accent-purple focus-visible:border-accent-purple transition-all duration-300 rounded-[4px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-10 border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent-purple rounded-[4px] font-mono text-xs uppercase tracking-wider transition-all duration-300 ${selectedTags.length > 0 ? 'border-accent-purple bg-accent-purple-subtle text-accent-purple' : ''
                }`}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('blog.filterByTags')}
              {selectedTags.length > 0 && (
                <Badge className="ml-2 bg-accent-purple text-white hover:bg-accent-purple border-none rounded-[2px] px-1.5 min-w-[20px] justify-center">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-surface-card border-border-default rounded-[6px] shadow-2xl p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h4 className="font-mono text-xs font-bold text-text-primary uppercase tracking-widest">Filtrar por tags</h4>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTagFilters}
                    className="h-6 px-2 text-[10px] text-text-muted hover:text-text-primary uppercase tracking-widest font-mono rounded-[2px]"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('blog.clear')}
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 block-scroll">
                {allTags.length === 0 ? (
                  <p className="text-xs text-text-muted font-mono">{t('blog.noTags')}</p>
                ) : (
                  allTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-surface-elevated rounded-[4px] p-2 transition-colors border border-transparent hover:border-border-subtle"
                      onClick={() => handleTagToggle(tag)}
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                        className="border-border-default data-[state=checked]:bg-accent-purple data-[state=checked]:border-accent-purple rounded-[2px]"
                      />
                      <label className="text-xs font-mono text-text-secondary cursor-pointer flex-1 pt-[1px]">
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

      {/* Posts List - Editor Gutter Style */}
      <motion.div variants={item} className="space-y-0 border border-border-default rounded-[6px] bg-surface-sidebar overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="flex px-4 py-12">
            <div className="w-[30px] shrink-0 text-right text-text-muted select-none mr-6 opacity-50 font-mono text-xs pt-1">1</div>
            <div className="flex-1">
              <span className="text-text-muted italic font-mono text-sm">// {t('blog.noPosts')}</span>
            </div>
          </div>
        ) : (
          filteredPosts.map((post, idx) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div className="flex group border-b border-border-default last:border-b-0 hover:bg-surface-elevated transition-colors cursor-pointer relative items-stretch">
                {/* Gutter (Line Number) */}
                <div className="w-[45px] shrink-0 border-r border-border-subtle bg-surface-sidebar flex justify-end pt-[22px] pr-3 select-none text-text-muted group-hover:text-accent-purple group-hover:bg-accent-purple-subtle/50 transition-colors">
                  <span className="text-[10px] font-mono leading-none">{idx + 1}</span>
                </div>

                {/* Line Content */}
                <div className="flex-1 p-5 flex flex-col sm:flex-row gap-6 sm:items-center relative z-10 overflow-hidden bg-surface-card group-hover:bg-surface-elevated transition-colors">
                  <div className="w-full sm:w-[180px] h-[110px] shrink-0 rounded-[4px] overflow-hidden border border-border-subtle relative">
                    <div className="absolute inset-0 bg-accent-purple/0 group-hover:bg-accent-purple/10 transition-colors z-10"></div>
                    <img
                      src={post.image || "https://via.placeholder.com/400x200"}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-w-0 h-full justify-center">
                    <div className="flex items-center text-[10px] text-text-muted mb-2 space-x-3 font-mono uppercase tracking-widest pl-2 border-l border-border-subtle h-[14px]">
                      <span className="text-text-secondary">{new Date(post.published_at).toLocaleDateString()}</span>
                      <span className="w-0.5 h-0.5 rounded-[1px] bg-border-default"></span>
                      <span className="text-accent-green">{Math.ceil(post.content.split(' ').length / 200)}m RUNTIME</span>
                    </div>

                    <h3 className="text-lg font-bold font-display text-text-primary mb-1 group-hover:text-accent-purple transition-colors truncate">
                      {post.title}
                    </h3>

                    <p className="text-text-secondary text-xs mb-3 line-clamp-2 font-mono leading-relaxed">
                      {post.subtitle}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-1">
                      <div className="flex flex-wrap gap-2">
                        {post.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-surface-sidebar text-text-secondary border border-border-subtle group-hover:border-accent-purple/30 group-hover:text-text-primary transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center text-[10px] font-mono text-text-muted group-hover:text-accent-purple uppercase tracking-widest transition-colors">
                        {t('blog.readMore')} <ChevronRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
