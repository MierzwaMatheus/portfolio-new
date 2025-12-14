import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Pencil, Loader2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Types
interface ResumeItem {
  id: string;
  type: string;
  content: any;
  order_index: number;
}

// Sortable Item Component for Simple Lists
function SortableSimpleItem({ id, text, onDelete }: { id: string, text: string, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card border border-white/10 p-3 rounded-md group">
      <div {...attributes} {...listeners} className="cursor-move text-gray-500 hover:text-white">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="flex-1 text-white">{text}</span>
      <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function AdminResume() {
  const [items, setItems] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simple inputs state
  const [newCourse, setNewCourse] = useState("");
  const [newVolunteer, setNewVolunteer] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .schema("app_portfolio")
        .from("resume_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar dados do currículo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (type: string, item: ResumeItem | null = null) => {
    setActiveModal(type);
    setEditingItem(item);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const content: any = {};

    formData.forEach((value, key) => {
      content[key] = value;
    });

    try {
      if (editingItem) {
        const { error } = await supabase
          .schema("app_portfolio")
          .from("resume_items")
          .update({ content })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item atualizado com sucesso");
      } else {
        const { error } = await supabase
          .schema("app_portfolio")
          .from("resume_items")
          .insert([{
            type: activeModal,
            content,
            order_index: items.filter(i => i.type === activeModal).length
          }]);

        if (error) throw error;
        toast.success("Item criado com sucesso");
      }
      fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Erro ao salvar item");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      try {
        const { error } = await supabase
          .schema("app_portfolio")
          .from("resume_items")
          .delete()
          .eq("id", id);

        if (error) throw error;
        toast.success("Item excluído com sucesso");
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error("Erro ao excluir item");
      }
    }
  };

  // Simple List Handlers
  const handleAddSimpleItem = async (type: string) => {
    let text = "";
    if (type === 'course') {
      text = newCourse;
      setNewCourse("");
    } else if (type === 'volunteer') {
      text = newVolunteer;
      setNewVolunteer("");
    } else if (type === 'soft_skill') {
      text = newSoftSkill;
      setNewSoftSkill("");
    }

    if (!text.trim()) return;

    try {
      const { error } = await supabase
        .schema("app_portfolio")
        .from("resume_items")
        .insert([{
          type,
          content: { text },
          order_index: items.filter(i => i.type === type).length
        }]);

      if (error) throw error;
      toast.success("Item adicionado com sucesso");
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Erro ao adicionar item");
    }
  };

  const handleDragEnd = async (event: DragEndEvent, type: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const typeItems = items.filter(i => i.type === type);
      const oldIndex = typeItems.findIndex((item) => item.id === active.id);
      const newIndex = typeItems.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(typeItems, oldIndex, newIndex);

      // Optimistic update
      const otherItems = items.filter(i => i.type !== type);
      setItems([...otherItems, ...newOrder]);

      // Update in DB
      try {
        const updates = newOrder.map((item, index) => ({
          id: item.id,
          type: item.type,
          content: item.content,
          order_index: index,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .schema("app_portfolio")
          .from("resume_items")
          .upsert(updates);

        if (error) throw error;
      } catch (error) {
        console.error("Error reordering items:", error);
        toast.error("Erro ao reordenar itens");
        fetchItems(); // Revert on error
      }
    }
  };

  const getItemsByType = (type: string) => items.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Currículo</h1>
          <p className="text-gray-400">Gerencie suas experiências, formação e habilidades</p>
        </div>

        <Tabs defaultValue="experience" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 w-full justify-start overflow-x-auto">
            <TabsTrigger value="experience">Experiência</TabsTrigger>
            <TabsTrigger value="education">Formação</TabsTrigger>
            <TabsTrigger value="skill">Habilidades</TabsTrigger>
            <TabsTrigger value="soft_skill">Soft Skills</TabsTrigger>
            <TabsTrigger value="course">Cursos</TabsTrigger>
            <TabsTrigger value="language">Idiomas</TabsTrigger>
            <TabsTrigger value="volunteer">Voluntariado</TabsTrigger>
          </TabsList>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("experience")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Experiência
              </Button>
            </div>
            {getItemsByType("experience").map(item => (
              <Card key={item.id} className="bg-card border-white/10 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                    {item.content.role}
                  </CardTitle>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal("experience", item)}>
                      <Pencil className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neon-green text-sm mb-2">{item.content.company} | {item.content.period}</p>
                  <p className="text-gray-400 text-sm line-clamp-2">{item.content.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("education")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Formação
              </Button>
            </div>
            {getItemsByType("education").map(item => (
              <Card key={item.id} className="bg-card border-white/10 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                    {item.content.degree}
                  </CardTitle>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal("education", item)}>
                      <Pencil className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neon-green text-sm mb-2">{item.content.institution} | {item.content.period}</p>
                  <p className="text-gray-400 text-sm line-clamp-2">{item.content.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skill" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("skill")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Habilidade
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getItemsByType("skill").map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                      <div>
                        <h4 className="text-white font-medium">{item.content.name}</h4>
                        <div className="w-32 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-neon-green" style={{ width: `${item.content.level}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("skill", item)}>
                        <Pencil className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Soft Skills Tab (Simple List) */}
          <TabsContent value="soft_skill" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma soft skill..."
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('soft_skill')}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => handleAddSimpleItem('soft_skill')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'soft_skill')}>
              <SortableContext items={getItemsByType("soft_skill")} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("soft_skill").map((item) => (
                    <SortableSimpleItem
                      key={item.id}
                      id={item.id}
                      text={item.content.text}
                      onDelete={(id) => handleDelete(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          {/* Courses Tab (Simple List) */}
          <TabsContent value="course" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome do curso e instituição..."
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('course')}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => handleAddSimpleItem('course')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'course')}>
              <SortableContext items={getItemsByType("course")} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("course").map((item) => (
                    <SortableSimpleItem
                      key={item.id}
                      id={item.id}
                      text={item.content.text}
                      onDelete={(id) => handleDelete(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="language" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("language")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Idioma
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getItemsByType("language").map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                      <div>
                        <h4 className="text-white font-medium">{item.content.name}</h4>
                        <p className="text-neon-green text-sm">{item.content.level}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("language", item)}>
                        <Pencil className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Volunteer Tab (Simple List) */}
          <TabsContent value="volunteer" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o cargo, organização e período..."
                value={newVolunteer}
                onChange={(e) => setNewVolunteer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('volunteer')}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => handleAddSimpleItem('volunteer')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'volunteer')}>
              <SortableContext items={getItemsByType("volunteer")} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("volunteer").map((item) => (
                    <SortableSimpleItem
                      key={item.id}
                      id={item.id}
                      text={item.content.text}
                      onDelete={(id) => handleDelete(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

        </Tabs>

        {/* Shared Modal */}
        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-black border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? "Editar" : "Adicionar"} {
                  activeModal === "experience" ? "Experiência" :
                    activeModal === "education" ? "Formação" :
                      activeModal === "skill" ? "Habilidade" :
                        activeModal === "language" ? "Idioma" : "Item"
                }
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de currículo</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {activeModal === "experience" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Cargo</Label>
                      <Input name="role" defaultValue={editingItem?.content.role} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Empresa</Label>
                      <Input name="company" defaultValue={editingItem?.content.company} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Período</Label>
                    <Input name="period" defaultValue={editingItem?.content.period} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea name="description" defaultValue={editingItem?.content.description} className="bg-white/5 border-white/10 text-white min-h-[100px]" required />
                  </div>
                </>
              )}

              {activeModal === "education" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Curso/Grau</Label>
                      <Input name="degree" defaultValue={editingItem?.content.degree} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Instituição</Label>
                      <Input name="institution" defaultValue={editingItem?.content.institution} className="bg-white/5 border-white/10 text-white" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Período</Label>
                    <Input name="period" defaultValue={editingItem?.content.period} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea name="description" defaultValue={editingItem?.content.description} className="bg-white/5 border-white/10 text-white min-h-[100px]" required />
                  </div>
                </>
              )}

              {activeModal === "skill" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Nome da Habilidade</Label>
                    <Input name="name" defaultValue={editingItem?.content.name} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nível de Domínio (0-100)</Label>
                    <Input name="level" type="number" min="0" max="100" defaultValue={editingItem?.content.level} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                </>
              )}

              {activeModal === "language" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Idioma</Label>
                    <Input name="name" defaultValue={editingItem?.content.name} className="bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nível</Label>
                    <Input name="level" defaultValue={editingItem?.content.level} placeholder="Ex: Avançado, Nativo" className="bg-white/5 border-white/10 text-white" required />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-gray-400">Cancelar</Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
