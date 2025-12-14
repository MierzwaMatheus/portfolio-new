import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { ProjectTagsInput } from "@/components/admin/ProjectTagsInput";

interface Project {
  id: number;
  title: string;
  description: string;
  long_description: string;
  tags: string[];
  images: string[];
  demo_link: string;
  github_link: string;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .schema('app_portfolio')
        .from('projects')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (project: Project | null = null) => {
    setEditingProject(project);
    setProjectImages(project ? project.images : []);
    setSelectedTags(project ? project.tags : []);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const projectData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      long_description: formData.get('long_description') as string,
      tags: selectedTags,
      images: projectImages,
      demo_link: formData.get('demo') as string,
      github_link: formData.get('github') as string,
    };

    try {
      if (editingProject) {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('projects')
          .insert([projectData]);
        if (error) throw error;
      }

      await fetchProjects();
      setIsDialogOpen(false);
      setEditingProject(null);
      setProjectImages([]);
      setSelectedTags([]);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Erro ao salvar projeto');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        const { error } = await supabase
          .schema('app_portfolio')
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setProjects(projects.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Erro ao excluir projeto');
      }
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
                <Input name="title" id="title" defaultValue={editingProject?.title} className="bg-white/5 border-white/10 text-white" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descrição Curta</Label>
                <Textarea name="description" id="description" defaultValue={editingProject?.description} className="bg-white/5 border-white/10 text-white" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description" className="text-white">Descrição Longa</Label>
                <Textarea name="long_description" id="long_description" defaultValue={editingProject?.long_description} className="bg-white/5 border-white/10 text-white h-32" />
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
                <Label className="text-white">Tags</Label>
                <ProjectTagsInput selectedTags={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo" className="text-white">Link Demo</Label>
                  <Input name="demo" id="demo" defaultValue={editingProject?.demo_link} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-white">Link GitHub</Label>
                  <Input name="github" id="github" defaultValue={editingProject?.github_link} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancelar</Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-white">Carregando projetos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-card border-white/10 overflow-hidden group">
                <div className="relative h-48">
                  {project.images && project.images.length > 0 ? (
                    <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">Sem imagem</div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    {project.images?.length || 0} imagens
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
                    {project.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-white/5 text-gray-300 border-white/10">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
