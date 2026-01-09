import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";

export default function BlogPost() {
    const { t } = useTranslation();
    const { locale, isLoading: i18nLoading } = useI18n();
    const [match, params] = useRoute("/blog/:slug");
    const [postRaw, setPostRaw] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        if (params?.slug && !i18nLoading) {
            fetchPost(params.slug);
        }
    }, [params?.slug, i18nLoading]); // Removido locale das dependências - dados já vêm com JSONB completo

    const fetchPost = async (slug: string) => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .schema('app_portfolio')
                .from('posts')
                .select('id, title, subtitle, content, title_translations, subtitle_translations, content_translations, image, featured, status, created_at, published_at, tags, slug')
                .eq('slug', slug)
                .eq('status', 'published')
                .single();

            if (error) throw error;
            setPostRaw(data);
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || i18nLoading) {
        return <PageSkeleton />;
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <h1 className="text-3xl font-bold text-white">{t('blog.postNotFound')}</h1>
                    <p className="text-gray-400">{t('blog.postNotFoundDescription')}</p>
                    <Link href="/blog">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('blog.backToBlog')}
                        </Button>
                    </Link>
            </div>
        );
    }

    return (
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-12"
            >
                <Link href="/blog">
                    <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('blog.backToBlog')}
                    </Button>
                </Link>

                <header className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {post.tags?.map((tag: string) => (
                            <Badge key={tag} className="bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border-neon-purple/20">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        {post.title}
                    </h1>

                    {post.subtitle && (
                        <p className="text-xl text-gray-300 leading-relaxed">
                            {post.subtitle}
                        </p>
                    )}

                    <div className="flex items-center gap-6 text-gray-400 text-sm border-b border-white/10 pb-8">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.published_at).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</span>
                        </div>
                        {/* Read time could be calculated based on word count */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{Math.ceil(post.content.split(' ').length / 200)} {t('blog.readTime')}</span>
                        </div>
                    </div>
                </header>

                {post.image && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </motion.article>
    );
}
