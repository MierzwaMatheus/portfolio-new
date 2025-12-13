import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ImagePicker } from "@/components/admin/ImagePicker";

// Mock Data
const INITIAL_ABOUT = `Sou um entusiasta de Front-End com mais de 4 anos de experiência como Líder Técnico e Desenvolvedor. Minha paixão é transformar interfaces web complexas em experiências intuitivas e ágeis, utilizando tecnologias como React, TypeScript e Inteligência Artificial.

Tenho um histórico sólido na revitalização de UI/UX, criação de dashboards dinâmicos e desenvolvimento de interfaces interativas para IAs e chatbots. Gosto de liderar equipes técnicas, promovendo inovações no desenvolvimento, como a integração de ferramentas de IA (por exemplo, Cursor).`;

const INITIAL_SERVICES = [
  { 
    id: 1, 
    title: "Desenvolvimento Front-end de Alta Performance", 
    description: "Minha paixão é dar vida a interfaces web complexas e responsivas, utilizando o poder de tecnologias como React e TypeScript para criar experiências de usuário fluidas, interativas e com performance otimizada." 
  },
  { 
    id: 2, 
    title: "Liderança Técnica e Inovação em Front-end", 
    description: "Adoro guiar equipes de front-end, definindo arquiteturas robustas, implementando padrões de código eficientes e introduzindo fluxos de trabalho inovadores (incluindo ferramentas de IA!) para turbinar a produtividade e a qualidade das entregas." 
  },
  { 
    id: 3, 
    title: "UI/UX Design Focado na Experiência", 
    description: "Mergulho no universo do UI/UX para desenhar interfaces não apenas visualmente atraentes, mas incrivelmente intuitivas e eficientes, transformando requisitos de negócio em jornadas que os usuários realmente apreciam e entendem." 
  },
  { 
    id: 4, 
    title: "Interfaces Inteligentes com IA", 
    description: "Sou um entusiasta da integração de Inteligência Artificial no front-end, criando desde interfaces interativas para chatbots e agentes de IA até utilizando ferramentas assistidas por IA para otimizar o desenvolvimento e entregar soluções mais espertas e dinâmicas." 
  }
];

const INITIAL_TESTIMONIALS = [
  {
    id: 1,
    name: "Lucas",
    role: "CEO ForgeCode",
    image: "https://i.pravatar.cc/150?u=lucas",
    text: "Obrigado Matheus pela modernização da nossa marca. Foi essencial essa reformulação! Superou as expectativas, trabalho rápido e muito eficiente. Nós da Forge Code agradecemos muito a atenção e os serviços prestados!"
  },
  {
    id: 2,
    name: "Luiz Cossolin",
    role: "CEO Paith",
    image: "https://i.pravatar.cc/150?u=luiz",
    text: "Valeu demais pelo trabalho! Desde o início, aprendi muito sobre identidade visual. A primeira chamada que tivemos esclareceu todas as dúvidas e permitiu explicar bem o que eu queria. O questionário é bastante completo, e o serviço de atendimento está em outro nível."
  },
  {
    id: 3,
    name: "Fabio Oliveira",
    role: "CEO Sampa Invest Group",
    image: "https://i.pravatar.cc/150?u=fabio",
    text: "Cara, a minha marca ficou top demais! Sério, eu fiquei impressionado com o que a Roxus conseguiu fazer. Eu já esperava algo legal, mas isso foi muito além! Com certeza vou recomendar para todos os meus amigos e colegas de trabalho."
  },
  {
    id: 4,
    name: "Maria Cecilia",
    role: "CEO Aroma & Latte",
    image: "https://i.pravatar.cc/150?u=maria",
    text: "Quando iniciei o projeto não tinha certeza se era um bom investimento, agora já passaram 3 meses e nós percebemos um aumento de 30% no marketing orgânico da marca. A forma que a Roxus encaminhou o projeto fez os clientes se sentirem muito mais próximos da nossa marca."
  }
];

export default function AdminHome() {
  const [aboutText, setAboutText] = useState(INITIAL_ABOUT);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [testimonials, setTestimonials] = useState(INITIAL_TESTIMONIALS);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "testimonial" && item) {
      setSelectedImage(item.image);
    } else {
      setSelectedImage("");
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setSelectedImage("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save would go here
    handleCloseModal();
  };

  const handleDelete = (type: string, id: number) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      if (type === "service") setServices(services.filter(i => i.id !== id));
      if (type === "testimonial") setTestimonials(testimonials.filter(i => i.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Edição da Página Inicial</h1>
        </div>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-2">
            <TabsTrigger value="about">Sobre Mim</TabsTrigger>
            <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-8 mt-6">
            {/* Sobre Mim Section */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Sobre Mim</CardTitle>
                <p className="text-gray-400 text-sm">Edite o texto de apresentação principal</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="bg-white/5 border-white/10 text-white min-h-[150px]"
                />
                <div className="flex justify-end">
                  <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* O que eu faço Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">O que eu faço</h2>
                <Button onClick={() => handleOpenModal("service")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(item => (
                  <Card key={item.id} className="bg-card border-white/10 group">
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                      <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal("service", item)} className="text-white hover:text-neon-purple">
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("service", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Depoimentos</h2>
              <Button onClick={() => handleOpenModal("testimonial")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Depoimento
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <p className="text-gray-400 text-xs">{item.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">"{item.text}"</p>
                    <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal("testimonial", item)} className="text-white hover:text-neon-purple">
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete("testimonial", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Shared Modal */}
        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-black border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? "Editar" : "Adicionar"} {activeModal === "service" ? "Serviço" : "Depoimento"}
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de edição</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {activeModal === "service" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Título</Label>
                    <Input defaultValue={editingItem?.title} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea defaultValue={editingItem?.description} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
                  </div>
                </>
              )}

              {activeModal === "testimonial" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nome</Label>
                      <Input defaultValue={editingItem?.name} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Cargo/Empresa</Label>
                      <Input defaultValue={editingItem?.role} className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Foto</Label>
                    <div className="flex items-center gap-4">
                      {selectedImage && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <ImagePicker 
                        onSelect={setSelectedImage}
                        trigger={
                          <Button type="button" variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {selectedImage ? "Alterar Imagem" : "Selecionar Imagem"}
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Depoimento</Label>
                    <Textarea defaultValue={editingItem?.text} className="bg-white/5 border-white/10 text-white min-h-[100px]" />
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
