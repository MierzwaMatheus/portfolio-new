import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Filter, Eye, EyeOff, Star } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock Data
const INITIAL_POSTS = [
  {
    id: 1,
    title: "Economia de Plataformas",
    subtitle: "Novas dinâmicas do trabalho digital",
    status: "published",
    featured: true,
    date: "2025-03-19",
    tags: ["Economia", "Trabalho"],
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "O Front-end na Era da IA",
    subtitle: "Revolução semântica e experiências superiores",
    status: "published",
    featured: false,
    date: "2025-06-15",
    tags: ["IA", "Frontend"],
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop"
  }
];

export default function AdminBlog() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [content, setContent] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const handleOpenDialog = (post: any = null) => {
    setEditingPost(post);
    setPreviewImage(post ? post.image : "");
    setContent(post ? "Conteúdo do post..." : ""); // In real app, load content
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(false);
    setEditingPost(null);
    setContent("");
    setPreviewImage("");
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const toggleStatus = (id: number) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === "published" ? "draft" : "published" };
      }
      return p;
    }));
  };

  const toggleFeatured = (id: number) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, featured: !p.featured };
      }
      return p;
    }));
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
          <DialogContent className="bg-black border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <Input id="title" defaultValue={editingPost?.title} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="text-white">Subtítulo</Label>
                    <Input id="subtitle" defaultValue={editingPost?.subtitle} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">Data de Publicação</Label>
                    <Input id="date" type="date" defaultValue={editingPost?.date} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-white">Tags</Label>
                    <Input id="tags" defaultValue={editingPost?.tags.join(", ")} className="bg-white/5 border-white/10 text-white" />
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
                            <ImagePicker onSelect={setPreviewImage} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImagePicker onSelect={setPreviewImage} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-6 pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="featured" defaultChecked={editingPost?.featured} />
                      <Label htmlFor="featured" className="text-white">Destacar Post</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="status" defaultChecked={editingPost?.status === "published"} />
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
          {posts.map((post) => (
            <Card key={post.id} className="bg-card border-white/10 hover:border-neon-purple/30 transition-colors">
              <div className="flex flex-col md:flex-row gap-4 p-4">
                <img src={post.image} alt={post.title} className="w-full md:w-48 h-32 object-cover rounded-lg" />
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
                              onClick={() => toggleFeatured(post.id)}
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
                              onClick={() => toggleStatus(post.id)}
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
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-white/5 text-gray-300 border-white/10">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto pt-2">
                    <span>{post.date}</span>
                    <span className={`flex items-center gap-1 ${post.status === "published" ? "text-green-400" : "text-gray-500"}`}>
                      {post.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
