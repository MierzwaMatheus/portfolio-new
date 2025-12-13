import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Mock Data
const INITIAL_EXPERIENCE = [
  { id: 1, role: "Líder Técnico de Front-End", company: "InBot", period: "Jan-2025 - Atual", description: "Liderança técnica da equipe de front-end..." },
  { id: 2, role: "Programador Front-End e UI Designer", company: "InBot", period: "2024 - Jan-2025", description: "Revitalização completa das interfaces..." }
];

const INITIAL_EDUCATION = [
  { id: 1, degree: "Tecnólogo em Gestão de TI", institution: "Fatec de Barueri", period: "2020 - 2023", description: "Formação com foco em governança de TI..." }
];

const INITIAL_SKILLS = [
  { id: 1, name: "React.js", level: 90 },
  { id: 2, name: "TypeScript", level: 90 },
  { id: 3, name: "Tailwind CSS", level: 90 }
];

const INITIAL_COURSES = [
  { id: 1, text: "NLW Together - Trilha ReactJS - Rocketseat" },
  { id: 2, text: "ChatGPT - Do Zero ao Avançado - Udemy" }
];

const INITIAL_LANGUAGES = [
  { id: 1, name: "Português", level: "Nativo" },
  { id: 2, name: "Inglês", level: "Avançado" },
  { id: 3, name: "Espanhol", level: "Intermediário" }
];

const INITIAL_VOLUNTEER = [
  { id: 1, text: "Diretor de Imagem Pública - Rotaract Club Barueri (2019-2020)" }
];

const INITIAL_SOFT_SKILLS = [
  { id: 1, text: "Liderança" },
  { id: 2, text: "Comunicação" },
  { id: 3, text: "Trabalho em Equipe" }
];

// Sortable Item Component for Simple Lists
function SortableSimpleItem({ id, text, onDelete }: { id: number, text: string, onDelete: (id: number) => void }) {
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
  const [experience, setExperience] = useState(INITIAL_EXPERIENCE);
  const [education, setEducation] = useState(INITIAL_EDUCATION);
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [languages, setLanguages] = useState(INITIAL_LANGUAGES);
  const [volunteer, setVolunteer] = useState(INITIAL_VOLUNTEER);
  const [softSkills, setSoftSkills] = useState(INITIAL_SOFT_SKILLS);

  // Simple inputs state
  const [newCourse, setNewCourse] = useState("");
  const [newVolunteer, setNewVolunteer] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save would go here based on activeModal type
    handleCloseModal();
  };

  const handleDelete = (type: string, id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      if (type === "experience") setExperience(experience.filter(i => i.id !== id));
      if (type === "education") setEducation(education.filter(i => i.id !== id));
      if (type === "skills") setSkills(skills.filter(i => i.id !== id));
      if (type === "languages") setLanguages(languages.filter(i => i.id !== id));
    }
  };

  // Simple List Handlers
  const handleAddSimpleItem = (type: 'courses' | 'volunteer' | 'softSkills') => {
    if (type === 'courses' && newCourse.trim()) {
      setCourses([...courses, { id: Date.now(), text: newCourse }]);
      setNewCourse("");
    } else if (type === 'volunteer' && newVolunteer.trim()) {
      setVolunteer([...volunteer, { id: Date.now(), text: newVolunteer }]);
      setNewVolunteer("");
    } else if (type === 'softSkills' && newSoftSkill.trim()) {
      setSoftSkills([...softSkills, { id: Date.now(), text: newSoftSkill }]);
      setNewSoftSkill("");
    }
  };

  const handleDeleteSimpleItem = (type: 'courses' | 'volunteer' | 'softSkills', id: number) => {
    if (type === 'courses') setCourses(courses.filter(i => i.id !== id));
    if (type === 'volunteer') setVolunteer(volunteer.filter(i => i.id !== id));
    if (type === 'softSkills') setSoftSkills(softSkills.filter(i => i.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent, type: 'courses' | 'volunteer' | 'softSkills') => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      if (type === 'courses') {
        setCourses((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else if (type === 'volunteer') {
        setVolunteer((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else if (type === 'softSkills') {
        setSoftSkills((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

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
            <TabsTrigger value="skills">Habilidades</TabsTrigger>
            <TabsTrigger value="softSkills">Soft Skills</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="languages">Idiomas</TabsTrigger>
            <TabsTrigger value="volunteer">Voluntariado</TabsTrigger>
          </TabsList>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("experience")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Experiência
              </Button>
            </div>
            {experience.map(item => (
              <Card key={item.id} className="bg-card border-white/10 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                    {item.role}
                  </CardTitle>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal("experience", item)}>
                      <Pencil className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("experience", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neon-green text-sm mb-2">{item.company} | {item.period}</p>
                  <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
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
            {education.map(item => (
              <Card key={item.id} className="bg-card border-white/10 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                    {item.degree}
                  </CardTitle>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal("education", item)}>
                      <Pencil className="w-4 h-4 text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("education", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neon-green text-sm mb-2">{item.institution} | {item.period}</p>
                  <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("skills")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Habilidade
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <div className="w-32 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-neon-green" style={{ width: `${item.level}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("skills", item)}>
                        <Pencil className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("skills", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Soft Skills Tab (Simple List) */}
          <TabsContent value="softSkills" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input 
                placeholder="Digite uma soft skill..." 
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('softSkills')}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => handleAddSimpleItem('softSkills')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'softSkills')}>
              <SortableContext items={softSkills} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {softSkills.map((item) => (
                    <SortableSimpleItem 
                      key={item.id} 
                      id={item.id} 
                      text={item.text} 
                      onDelete={(id) => handleDeleteSimpleItem('softSkills', id)} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          {/* Courses Tab (Simple List) */}
          <TabsContent value="courses" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input 
                placeholder="Digite o nome do curso e instituição..." 
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('courses')}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={() => handleAddSimpleItem('courses')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'courses')}>
              <SortableContext items={courses} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {courses.map((item) => (
                    <SortableSimpleItem 
                      key={item.id} 
                      id={item.id} 
                      text={item.text} 
                      onDelete={(id) => handleDeleteSimpleItem('courses', id)} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("languages")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Idioma
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {languages.map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <p className="text-neon-green text-sm">{item.level}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("languages", item)}>
                        <Pencil className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete("languages", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
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
              <SortableContext items={volunteer} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {volunteer.map((item) => (
                    <SortableSimpleItem 
                      key={item.id} 
                      id={item.id} 
                      text={item.text} 
                      onDelete={(id) => handleDeleteSimpleItem('volunteer', id)} 
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
                  activeModal === "skills" ? "Habilidade" :
                  activeModal === "languages" ? "Idioma" : "Item"
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
                      <Input defaultValue={editingItem?.role} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Empresa</Label>
                      <Input defaultValue={editingItem?.company} className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Período</Label>
                    <Input defaultValue={editingItem?.period} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea defaultValue={editingItem?.description} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
                  </div>
                </>
              )}

              {activeModal === "education" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Curso/Grau</Label>
                      <Input defaultValue={editingItem?.degree} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Instituição</Label>
                      <Input defaultValue={editingItem?.institution} className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Período</Label>
                    <Input defaultValue={editingItem?.period} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea defaultValue={editingItem?.description} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
                  </div>
                </>
              )}

              {activeModal === "skills" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Nome da Habilidade</Label>
                    <Input defaultValue={editingItem?.name} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nível de Domínio (0-100)</Label>
                    <Input type="number" defaultValue={editingItem?.level} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </>
              )}

              {activeModal === "languages" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Idioma</Label>
                    <Input defaultValue={editingItem?.name} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Nível</Label>
                    <Input defaultValue={editingItem?.level} placeholder="Ex: Avançado, Nativo" className="bg-white/5 border-white/10 text-white" />
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
