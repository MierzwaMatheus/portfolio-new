import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Mock Data
const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "E-commerce Dashboard",
    description: "Dashboard administrativo completo para gestão de vendas e estoque.",
    tags: ["React", "TypeScript", "Tailwind"],
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
    ]
  },
  {
    id: 2,
    title: "App de Finanças Pessoais",
    description: "Aplicação mobile-first para controle de gastos e investimentos.",
    tags: ["React Native", "Expo", "Node.js"],
    images: [
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2626&auto=format&fit=crop"
    ]
  },
  {
    id: 3,
    title: "Plataforma de Cursos",
    description: "Sistema de LMS com suporte a vídeo aulas e exercícios interativos.",
    tags: ["Next.js", "Prisma", "PostgreSQL"],
    images: [
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2574&auto=format&fit=crop"
    ]
  }
];

export default function AdminProjects() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectImages, setProjectImages] = useState<string[]>([]);

  const handleOpenDialog = (project: any = null) => {
    setEditingProject(project);
    setProjectImages(project ? project.images : []);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save project would go here
    setIsDialogOpen(false);
    setEditingProject(null);
    setProjectImages([]);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const addImage = (url: string) => {
    setProjectImages([...projectImages, url]);
  };

  const removeImage = (index: number) => {
    setProjectImages(projectImages.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Projetos</h1>
            <p className="text-gray-400">Gerencie os projetos exibidos no seu portfólio</p>
          </div>
          <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProject ? "Editar Projeto" : "Adicionar Novo Projeto"}
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de projeto</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Título</Label>
                <Input id="title" defaultValue={editingProject?.title} className="bg-white/5 border-white/10 text-white" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descrição Curta</Label>
                <Textarea id="description" defaultValue={editingProject?.description} className="bg-white/5 border-white/10 text-white" />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Galeria de Imagens</Label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {projectImages.map((img, index) => (
                    <div key={index} className="relative group aspect-video rounded-md overflow-hidden border border-white/10">
                      <img src={img} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                          Capa
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="aspect-video flex items-center justify-center border border-dashed border-white/20 rounded-md bg-white/5">
                    <ImagePicker onSelect={addImage} />
                  </div>
                </div>
                <p className="text-xs text-gray-500">A primeira imagem será usada como capa do projeto.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-white">Tags (separadas por vírgula)</Label>
                <Input id="tags" defaultValue={editingProject?.tags.join(", ")} className="bg-white/5 border-white/10 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo" className="text-white">Link Demo</Label>
                  <Input id="demo" placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-white">Link GitHub</Label>
                  <Input id="github" placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancelar</Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card border-white/10 overflow-hidden group">
              <div className="relative h-48">
                <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                  {project.images.length} imagens
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleOpenDialog(project)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-start">
                  {project.title}
                  <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white/5 text-gray-300 border-white/10">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
