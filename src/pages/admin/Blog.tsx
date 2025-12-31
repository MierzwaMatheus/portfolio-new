import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Filter, Eye, EyeOff, Star } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [content, setContent] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Posts fetched:', data?.length || 0);
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast.error(`Erro ao carregar posts: ${error?.message || 'Erro desconhecido'}`);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (post: any = null) => {
    setEditingPost(post);
    setPreviewImage(post ? post.image : "");
    // Extrai conteúdo do JSONB ou fallback para campo direto
    const contentPT = post?.content_translations?.['pt-BR'] || post?.content || "";
    setContent(contentPT);
    setIsPublished(post ? post.status === "published" : false);
    setIsFeatured(post ? post.featured : false);
    setIsDialogOpen(true);
  };

  // Helper para extrair valor do JSONB ou valor direto (fallback para compatibilidade)
  const getPostField = (post: any, field: string): string => {
    const translationsField = `${field}_translations`;
    if (post[translationsField] && post[translationsField]['pt-BR']) {
      return post[translationsField]['pt-BR'];
    }
    return post[field] || '';
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const titlePT = formData.get("title") as string;
    const subtitlePT = formData.get("subtitle") as string || '';
    const date = formData.get("date") as string;
    const tagsStr = formData.get("tags") as string;
    const status = isPublished ? "published" : "draft";
    const contentPT = content || '';

    const tags = tagsStr.split(",").map(t => t.trim()).filter(t => t);
    const slug = slugify(titlePT);

    try {
      // Traduz para inglês usando a Edge Function
      const textsToTranslate = [titlePT];
      if (subtitlePT) {
        textsToTranslate.push(subtitlePT);
      }
      if (contentPT) {
        textsToTranslate.push(contentPT);
      }

      const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
        body: {
          texts: textsToTranslate,
          source: 'pt',
          target: 'en',
        },
      });

      if (translateError) {
        console.error('Translation error:', translateError);
        toast.error('Erro ao traduzir. Salvando apenas em português.');
      }

      const translatedTexts = translateData?.translatedTexts || textsToTranslate;
      const titleEN = translatedTexts[0] || titlePT;
      const subtitleEN = subtitlePT ? (translatedTexts[1] || subtitlePT) : '';
      const contentEN = contentPT ? (translatedTexts[subtitlePT ? 2 : 1] || contentPT) : '';

      const postData = {
        title: titlePT,
        subtitle: subtitlePT || null,
        content: contentPT || null,
        title_translations: {
          'pt-BR': titlePT,
          'en-US': titleEN,
        },
        subtitle_translations: subtitlePT ? {
          'pt-BR': subtitlePT,
          'en-US': subtitleEN,
        } : null,
        content_translations: contentPT ? {
          'pt-BR': contentPT,
          'en-US': contentEN,
        } : null,
        image: previewImage,
        featured: isFeatured,
        status,
        published_at: date || null,
        tags,
        slug
      };

      if (editingPost) {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success("Post atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('posts')
          .insert([postData]);

        if (error) throw error;
        toast.success("Post criado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      setContent("");
      setPreviewImage("");
      setIsPublished(false);
      setIsFeatured(false);
      fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Erro ao salvar post");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      try {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('posts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success("Post excluído com sucesso!");
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error("Erro ao excluir post");
      }
    }
  };

  const toggleStatus = async (post: any) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    try {
      const { error } = await supabase
        .schema('app_portfolio')
        .from('posts')
        .update({ status: newStatus })
        .eq('id', post.id);

      if (error) throw error;
      toast.success(`Post ${newStatus === 'published' ? 'publicado' : 'despublicado'}`);
      fetchPosts();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erro ao atualizar status");
    }
  };

  const toggleFeatured = async (post: any) => {
    try {
      const { error } = await supabase
        .schema('app_portfolio')
        .from('posts')
        .update({ featured: !post.featured })
        .eq('id', post.id);

      if (error) throw error;
      toast.success(`Destaque ${!post.featured ? 'adicionado' : 'removido'}`);
      fetchPosts();
    } catch (error) {
      console.error('Error updating featured:', error);
      toast.error("Erro ao atualizar destaque");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Blog</h1>
            <p className="text-gray-400">Gerencie seus artigos e publicações</p>
          </div>
          <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-background border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPost ? "Editar Artigo" : "Novo Artigo"}
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de artigo</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título</Label>
                    <Input name="title" id="title" defaultValue={editingPost ? getPostField(editingPost, 'title') : ''} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="text-white">Subtítulo</Label>
                    <Input name="subtitle" id="subtitle" defaultValue={editingPost ? getPostField(editingPost, 'subtitle') : ''} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">Data de Publicação</Label>
                    <Input name="date" id="date" type="date" defaultValue={editingPost?.published_at} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-white">Tags (separadas por vírgula)</Label>
                    <Input name="tags" id="tags" defaultValue={editingPost?.tags?.join(", ")} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Imagem de Destaque</Label>
                    <div className="border border-white/10 rounded-lg p-4 bg-white/5 flex flex-col items-center justify-center min-h-[200px] relative">
                      {previewImage ? (
                        <>
                          <img src={previewImage} alt="Preview" className="max-h-[180px] rounded object-cover w-full" />
                          <div className="absolute bottom-2 right-2">
                            <ImagePicker onSelect={(url) => setPreviewImage(Array.isArray(url) ? url[0] : url)} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImagePicker onSelect={(url) => setPreviewImage(Array.isArray(url) ? url[0] : url)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-6 pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                      />
                      <Label htmlFor="featured" className="text-white">Destacar Post</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="status"
                        checked={isPublished}
                        onCheckedChange={setIsPublished}
                      />
                      <Label htmlFor="status" className="text-white">Publicado</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Conteúdo</Label>
                <RichTextEditor content={content} onChange={setContent} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancelar</Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar Artigo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex gap-4 items-center bg-card border border-white/10 p-4 rounded-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar artigos..." className="pl-10 bg-white/5 border-white/10 text-white" />
          </div>
          <Button variant="outline" className="border-white/10 text-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Carregando posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Nenhum post encontrado.</div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-card border-white/10 hover:border-neon-purple/30 transition-colors">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                  <img src={post.image || "https://via.placeholder.com/300x200"} alt={post.title} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {post.title}
                          {post.featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        </h3>
                        <p className="text-gray-400 text-sm">{post.subtitle}</p>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleFeatured(post)}
                                className={post.featured ? "text-yellow-400" : "text-gray-500"}
                              >
                                <Star className={`w-4 h-4 ${post.featured ? "fill-yellow-400" : ""}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{post.featured ? "Remover destaque" : "Destacar post"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleStatus(post)}
                                className={post.status === "published" ? "text-green-400" : "text-gray-500"}
                              >
                                {post.status === "published" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{post.status === "published" ? "Despublicar" : "Publicar"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(post)}>
                          <Pencil className="w-4 h-4 text-blue-400" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-white/5 text-gray-300 border-white/10">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto pt-2">
                      <span>{post.published_at}</span>
                      <span className={`flex items-center gap-1 ${post.status === "published" ? "text-green-400" : "text-gray-500"}`}>
                        {post.status === "published" ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
