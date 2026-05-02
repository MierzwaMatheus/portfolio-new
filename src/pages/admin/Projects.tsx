import { useState } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ProjectTagsInput } from "@/components/admin/ProjectTagsInput";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";

interface ProjectImage {
  _id: Id<"imageMetadata">;
  url: string | null;
  displayName?: string;
}

interface Project {
  _id: Id<"projects">;
  title: string;
  titleTranslations?: { ptBR: string; enUS?: string };
  description: string;
  descriptionTranslations?: { ptBR: string; enUS?: string };
  longDescription?: string;
  longDescriptionTranslations?: { ptBR: string; enUS?: string };
  tags: string[];
  imageIds: Id<"imageMetadata">[];
  images: ProjectImage[];
  demoLink?: string;
  githubLink?: string;
  orderIndex: number;
}

// Sortable Project Card Component
function SortableProjectCard({
  project,
  onEdit,
  onDelete
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: Id<"projects">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const coverUrl = project.images?.[0]?.url || null;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card border-white/10 overflow-hidden group">
        <div className="relative h-48">
          {coverUrl ? (
            <img src={coverUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">Sem imagem</div>
          )}
          <div className="absolute top-2 right-2 bg-background/60 px-2 py-1 rounded text-xs text-white">
            {project.images?.length || 0} imagens
          </div>
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => onEdit(project)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={() => onDelete(project._id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-start">
            {project.title}
            <div {...attributes} {...listeners} className="cursor-move">
              <GripVertical className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
            </div>
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
    </div>
  );
}

// Sortable Image Item Component
function SortableImageItem({
  img,
  index,
  onRemove
}: {
  img: { id: Id<"imageMetadata">; url: string | null };
  index: number;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-video rounded-md overflow-hidden border border-white/10">
      {img.url ? (
        <img src={img.url} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-white/5" />
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-background/60 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      {index === 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/60 text-white text-xs py-1 text-center">
          Capa
        </div>
      )}
    </div>
  );
}

export default function AdminProjects() {
  const projectsData = useQuery(api.projects.list, {}) as Project[] | undefined;
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const reorderProjects = useMutation(api.projects.reorder);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  // Track image picker selections as { id, url } pairs to render thumbnails locally
  const [projectImages, setProjectImages] = useState<{ id: Id<"imageMetadata">; url: string | null }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { translateFields, isTranslating } = useTranslateContent();
  const projects = projectsData ?? [];
  const isLoading = projectsData === undefined;

  const getProjectField = (project: Project, field: "title" | "description" | "longDescription"): string => {
    const translationsKey = `${field}Translations` as const;
    const translations = (project as any)[translationsKey];
    if (translations?.ptBR) return translations.ptBR;
    return ((project as any)[field] as string) || '';
  };

  const handleOpenDialog = (project: Project | null = null) => {
    setEditingProject(project);
    if (project) {
      const imgs = project.images
        .filter((img) => !!img)
        .map((img) => ({ id: img._id, url: img.url }));
      setProjectImages(imgs);
      setSelectedTags(project.tags || []);
    } else {
      setProjectImages([]);
      setSelectedTags([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const titlePT = formData.get('title') as string;
    const descriptionPT = formData.get('description') as string;
    const longDescriptionPT = formData.get('long_description') as string || '';

    try {
      const allFields: Record<string, string> = { title: titlePT, description: descriptionPT };
      if (longDescriptionPT) allFields.longDescription = longDescriptionPT;

      const existingTranslations = {
        title: editingProject?.titleTranslations,
        description: editingProject?.descriptionTranslations,
        longDescription: editingProject?.longDescriptionTranslations,
      };

      const changedFields = editingProject
        ? getChangedTranslatableFields(allFields, existingTranslations)
        : allFields;

      let partialTranslated: Record<string, string> = {};
      if (Object.keys(changedFields).length > 0) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        partialTranslated = await translateFields(changedFields);
        toast.dismiss(toastId);
      }

      const translated = {
        title: partialTranslated.title ?? editingProject?.titleTranslations?.enUS ?? titlePT,
        description: partialTranslated.description ?? editingProject?.descriptionTranslations?.enUS ?? descriptionPT,
        longDescription: partialTranslated.longDescription ?? editingProject?.longDescriptionTranslations?.enUS ?? longDescriptionPT,
      };

      const imageIds = projectImages.map((i) => i.id);
      const baseData = {
        title: titlePT,
        titleTranslations: { ptBR: titlePT, enUS: translated.title },
        description: descriptionPT,
        descriptionTranslations: { ptBR: descriptionPT, enUS: translated.description },
        longDescription: longDescriptionPT || undefined,
        longDescriptionTranslations: longDescriptionPT
          ? { ptBR: longDescriptionPT, enUS: translated.longDescription ?? longDescriptionPT }
          : undefined,
        tags: selectedTags,
        imageIds,
        demoLink: (formData.get('demo') as string) || undefined,
        githubLink: (formData.get('github') as string) || undefined,
      };

      if (editingProject) {
        await updateProject({
          id: editingProject._id,
          ...baseData,
          orderIndex: editingProject.orderIndex,
        });
      } else {
        const maxOrder = projects.length > 0
          ? Math.max(...projects.map(p => p.orderIndex ?? 0))
          : -1;
        await createProject({
          ...baseData,
          orderIndex: maxOrder + 1,
        });
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setProjectImages([]);
      setSelectedTags([]);
      toast.success(editingProject ? 'Projeto atualizado com sucesso' : 'Projeto criado com sucesso');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error?.message || 'Erro ao salvar projeto');
    }
  };

  const handleDelete = async (id: Id<"projects">) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      try {
        await removeProject({ id });
        toast.success("Projeto excluído com sucesso");
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Erro ao excluir projeto');
      }
    }
  };

  const addImage = (url: string | string[]) => {
    // ImagePicker passes Convex image IDs (as strings) per migration plan.
    const incoming = Array.isArray(url) ? url : [url];
    const additions = incoming.map((id) => ({ id: id as Id<"imageMetadata">, url: null }));
    setProjectImages([...projectImages, ...additions]);
  };

  const removeImage = (index: number) => {
    setProjectImages(projectImages.filter((_, i) => i !== index));
  };

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      setProjectImages(arrayMove(projectImages, oldIndex, newIndex));
    }
  };

  const imageSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((project) => project._id === active.id);
      const newIndex = projects.findIndex((project) => project._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(projects, oldIndex, newIndex);
      const items = newOrder.map((project, index) => ({ id: project._id, orderIndex: index }));

      try {
        await reorderProjects({ items });
        toast.success("Ordem atualizada com sucesso");
      } catch (error) {
        console.error("Error reordering projects:", error);
        toast.error("Erro ao reordenar projetos");
      }
    }
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
          <DialogContent className="bg-background border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Input name="title" id="title" defaultValue={editingProject ? getProjectField(editingProject, 'title') : ''} className="bg-white/5 border-white/10 text-white" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Descrição Curta</Label>
                <Textarea name="description" id="description" defaultValue={editingProject ? getProjectField(editingProject, 'description') : ''} className="bg-white/5 border-white/10 text-white" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description" className="text-white">Descrição Longa</Label>
                <Textarea name="long_description" id="long_description" defaultValue={editingProject ? getProjectField(editingProject, 'longDescription') : ''} className="bg-white/5 border-white/10 text-white h-32" />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Galeria de Imagens</Label>
                <DndContext
                  sensors={imageSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleImageDragEnd}
                >
                  <SortableContext
                    items={projectImages.map((_, index) => index)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {projectImages.map((img, index) => (
                        <SortableImageItem
                          key={`${img.id}-${index}`}
                          img={img}
                          index={index}
                          onRemove={removeImage}
                        />
                      ))}
                      <div className="aspect-video flex items-center justify-center border border-dashed border-white/20 rounded-md bg-white/5">
                        <ImagePicker onSelect={addImage} multiple />
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
                <p className="text-xs text-gray-500">A primeira imagem será usada como capa do projeto. Arraste as imagens para reordená-las.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <ProjectTagsInput selectedTags={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo" className="text-white">Link Demo</Label>
                  <Input name="demo" id="demo" defaultValue={editingProject?.demoLink} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-white">Link GitHub</Label>
                  <Input name="github" id="github" defaultValue={editingProject?.githubLink} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400">Cancelar</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-white">Carregando projetos...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map(p => p._id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <SortableProjectCard
                    key={project._id}
                    project={project}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </AdminLayout>
  );
}
