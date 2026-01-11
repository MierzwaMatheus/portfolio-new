import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { BlogRepository, BlogPost } from "@/repositories/interfaces/BlogRepository";

export function useBlogPosts(repository: BlogRepository) {
  const { locale } = useI18n();

  const { data: postsRaw, isLoading, error } = useQuery({
    queryKey: ['blog', 'posts'],
    queryFn: () => repository.list(),
  });

  // Deriva posts traduzidos baseados no locale atual (sem refetch)
  const posts = useMemo(() => {
    if (!postsRaw) return [];
    
    return postsRaw.map((post) => ({
      ...post,
      title: post.title_translations?.[locale] || post.title_translations?.['pt-BR'] || post.title || '',
      subtitle: post.subtitle_translations?.[locale] || post.subtitle_translations?.['pt-BR'] || post.subtitle || '',
      content: post.content_translations?.[locale] || post.content_translations?.['pt-BR'] || post.content || '',
    }));
  }, [postsRaw, locale]);

  const featuredPosts = useMemo(() => {
    return posts.filter((p) => p.featured === true);
  }, [posts]);

  return {
    posts,
    featuredPosts,
    isLoading,
    error,
  };
}

export function useBlogPost(repository: BlogRepository, slug: string) {
  const { locale } = useI18n();

  const { data: postRaw, isLoading, error } = useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: () => repository.getBySlug(slug),
    enabled: !!slug,
  });

  // Deriva post traduzido baseado no locale atual (sem refetch)
  const post = useMemo(() => {
    if (!postRaw) return null;
    
    return {
      ...postRaw,
      title: postRaw.title_translations?.[locale] || postRaw.title_translations?.['pt-BR'] || postRaw.title || '',
      subtitle: postRaw.subtitle_translations?.[locale] || postRaw.subtitle_translations?.['pt-BR'] || postRaw.subtitle || '',
      content: postRaw.content_translations?.[locale] || postRaw.content_translations?.['pt-BR'] || postRaw.content || '',
    };
  }, [postRaw, locale]);

  return {
    post,
    isLoading,
    error,
  };
}

