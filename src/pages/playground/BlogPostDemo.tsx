import { useState } from "react";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Eye, Star } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Helmet } from "react-helmet-async";

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  createdAt: number;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
}

export default function BlogPostDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [posts, setPosts] = usePlaygroundStorage<Post[]>("pg_blog_posts", []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const handleOpen = (post: Post | null = null) => {
    setEditingPost(post);
    setContent(post?.content ?? "");
    setIsPublished(post ? post.status === "published" : false);
    setIsFeatured(post?.featured ?? false);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const title = fd.get("title") as string;
    if (!title.trim()) return toast.error("Título obrigatório");

    const post: Post = {
      id: editingPost?.id ?? crypto.randomUUID(),
      title,
      subtitle: (fd.get("subtitle") as string) || "",
      slug: slugify(title),
      content,
      tags: ((fd.get("tags") as string) || "").split(",").map(t => t.trim()).filter(Boolean),
      featured: isFeatured,
      status: isPublished ? "published" : "draft",
      createdAt: editingPost?.createdAt ?? Date.now(),
    };

    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === post.id ? post : p));
      toast.success("Post atualizado!");
    } else {
      setPosts(prev => [post, ...prev]);
      toast.success("Post criado!");
      try { await logEvent({ sessionId, eventType: "playground.post_created", metadata: { title, status: post.status }, userAgent: navigator.userAgent }); } catch { /* */ }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post excluído!");
  };

  const toggleStatus = (post: Post) => {
    const next = post.status === "published" ? "draft" : "published";
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: next } : p));
    toast.success(next === "published" ? "Post publicado!" : "Post despublicado!");
  };

  return (
    <>
      <Helmet><title>Blog — Playground</title></Helmet>
      <PlaygroundLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Blog</h1>
            <Button onClick={() => handleOpen()} className="gap-2"><Plus className="h-4 w-4" />Novo Post</Button>
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum post criado ainda.</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{post.title}</span>
                        {post.featured && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                        <Badge variant={post.status === "published" ? "default" : "outline"} className="text-xs">
                          {post.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                        {post.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                      {post.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{post.subtitle}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(post.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={post.status === "published"} onCheckedChange={() => toggleStatus(post)} />
                      <Button size="sm" variant="ghost" onClick={() => setPreviewPost(post)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpen(post)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Título *</Label><Input name="title" defaultValue={editingPost?.title} required /></div>
                <div className="space-y-1.5"><Label>Subtítulo</Label><Input name="subtitle" defaultValue={editingPost?.subtitle} /></div>
              </div>
              <div className="space-y-1.5"><Label>Tags (separadas por vírgula)</Label><Input name="tags" defaultValue={editingPost?.tags.join(", ")} placeholder="react, typescript" /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={isPublished} onCheckedChange={setIsPublished} /><Label>Publicado</Label></div>
                <div className="flex items-center gap-2"><Switch checked={isFeatured} onCheckedChange={setIsFeatured} /><Label>Destaque</Label></div>
              </div>
              <div className="space-y-1.5">
                <Label>Conteúdo</Label>
                <RichTextEditor content={content} onChange={setContent} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Preview: {previewPost?.title}</DialogTitle></DialogHeader>
            {previewPost && (
              <article className="prose prose-invert max-w-none">
                {previewPost.subtitle && <p className="text-xl text-muted-foreground">{previewPost.subtitle}</p>}
                <div dangerouslySetInnerHTML={{ __html: previewPost.content || "<p><em>Sem conteúdo</em></p>" }} />
              </article>
            )}
          </DialogContent>
        </Dialog>
      </PlaygroundLayout>
    </>
  );
}
