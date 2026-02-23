import { PageSkeleton } from "@/components/PageSkeleton";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useBlogPost } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";

export default function BlogPost() {
    const { t } = useTranslation();
    const { isLoading: i18nLoading } = useI18n();
    const [match, params] = useRoute("/blog/:slug");
    const { post, isLoading } = useBlogPost(blogRepository, params?.slug || '');

    if (isLoading || i18nLoading) {
        return <PageSkeleton />;
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-3xl font-bold font-display text-text-primary uppercase tracking-tight">{t('blog.postNotFound')}</h1>
                <p className="text-text-muted font-mono">{t('blog.postNotFoundDescription')}</p>
                <Link href="/blog">
                    <Button variant="outline" className="mt-4 border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-elevated font-mono uppercase tracking-wider rounded-[4px] h-10 px-4">
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
                <Button variant="ghost" className="text-text-muted hover:text-text-primary -ml-4 font-mono uppercase tracking-widest text-xs h-8 px-4 rounded-[4px]">
                    <ArrowLeft className="mr-2 h-3 w-3" />
                    {t('blog.backToBlog')}
                </Button>
            </Link>

            <header className="space-y-6 border-b border-border-subtle pb-8">
                <div className="flex flex-wrap gap-2">
                    {post.tags?.map((tag: string) => (
                        <Badge key={tag} className="bg-surface-sidebar text-text-secondary border border-border-default hover:border-accent-purple hover:text-text-primary transition-colors font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-[3px]">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary leading-tight tracking-tight">
                    {post.title}
                </h1>

                {post.subtitle && (
                    <p className="text-xl text-text-secondary font-mono leading-relaxed max-w-3xl">
                        {post.subtitle}
                    </p>
                )}

                <div className="flex items-center gap-6 text-[10px] text-text-muted font-mono uppercase tracking-widest mt-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-accent-green" />
                        <span>{new Date(post.published_at).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}</span>
                    </div>
                    {/* Read time could be calculated based on word count */}
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-accent-green" />
                        <span>{Math.ceil(post.content.split(' ').length / 200)}m RUNTIME</span>
                    </div>
                </div>
            </header>

            {post.image && (
                <div className="relative aspect-video rounded-[6px] overflow-hidden border border-border-default">
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
