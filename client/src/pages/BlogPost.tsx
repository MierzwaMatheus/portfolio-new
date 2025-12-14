import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function BlogPost() {
    const [match, params] = useRoute("/blog/:slug");
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params?.slug) {
            fetchPost(params.slug);
        }
    }, [params?.slug]);

    const fetchPost = async (slug: string) => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .schema('app_portfolio')
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('status', 'published')
                .single();

            if (error) throw error;
            setPost(data);
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <PageSkeleton />
            </Layout>
        );
    }

    if (!post) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <h1 className="text-3xl font-bold text-white">Post não encontrado</h1>
                    <p className="text-gray-400">O artigo que você procura não existe ou foi removido.</p>
                    <Link href="/blog">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para o Blog
                        </Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-12"
            >
                <Link href="/blog">
                    <Button variant="ghost" className="text-gray-400 hover:text-white -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Blog
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
                            <span>{Math.ceil(post.content.split(' ').length / 200)} min de leitura</span>
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
        </Layout>
    );
}
