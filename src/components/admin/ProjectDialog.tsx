import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { ProjectTagsInput } from "@/components/admin/ProjectTagsInput";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Project {
    id: number;
    title: string;
    description: string;
    long_description: string;
    tags: string[];
    images: string[];
    demo_link: string;
    github_link: string;
    order_index?: number;
}

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project | null;
    onSave: () => void;
}

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
    const [projectImages, setProjectImages] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setProjectImages(project ? project.images : []);
            setSelectedTags(project ? project.tags : []);
        }
    }, [open, project]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const projectData: any = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            long_description: formData.get('long_description') as string,
            tags: selectedTags,
            images: projectImages,
            demo_link: formData.get('demo') as string,
            github_link: formData.get('github') as string,
        };

        try {
            if (project) {
                const { error } = await supabase
                    .schema('app_portfolio')
                    .from('projects')
                    .update(projectData)
                    .eq('id', project.id);
                if (error) throw error;
            } else {
                // Fetch current max order to append
                const { data: projects } = await supabase
                    .schema('app_portfolio')
                    .from('projects')
                    .select('order_index');

                const maxOrder = projects && projects.length > 0
                    ? Math.max(...projects.map((p: any) => p.order_index ?? 0))
                    : -1;

                projectData.order_index = maxOrder + 1;

                const { error } = await supabase
                    .schema('app_portfolio')
                    .from('projects')
                    .insert([projectData]);
                if (error) throw error;
            }

            toast.success(project ? 'Projeto atualizado com sucesso' : 'Projeto criado com sucesso');
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving project:', error);
            toast.error('Erro ao salvar projeto');
        }
    };

    const addImage = (url: string | string[]) => {
        if (Array.isArray(url)) {
            setProjectImages([...projectImages, ...url]);
        } else {
            setProjectImages([...projectImages, url]);
        }
    };

    const removeImage = (index: number) => {
        setProjectImages(projectImages.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-background border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {project ? "Editar Projeto" : "Adicionar Novo Projeto"}
                    </DialogTitle>
                    <VisuallyHidden>
                        <h2>Formulário de projeto</h2>
                    </VisuallyHidden>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-white">Título</Label>
                        <Input name="title" id="title" defaultValue={project?.title} className="bg-white/5 border-white/10 text-white" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-white">Descrição Curta</Label>
                        <Textarea name="description" id="description" defaultValue={project?.description} className="bg-white/5 border-white/10 text-white" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="long_description" className="text-white">Descrição Longa</Label>
                        <Textarea name="long_description" id="long_description" defaultValue={project?.long_description} className="bg-white/5 border-white/10 text-white h-32" />
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
                                        <div className="absolute bottom-0 left-0 right-0 bg-background/60 text-white text-xs py-1 text-center">
                                            Capa
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="aspect-video flex items-center justify-center border border-dashed border-white/20 rounded-md bg-white/5">
                                <ImagePicker onSelect={addImage} multiple />
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
                            <Input name="demo" id="demo" defaultValue={project?.demo_link} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="github" className="text-white">Link GitHub</Label>
                            <Input name="github" id="github" defaultValue={project?.github_link} placeholder="https://" className="bg-white/5 border-white/10 text-white" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">Cancelar</Button>
                        <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
