

import { useState, useEffect } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function AdminHome() {
  const homeContentList = useQuery(api.homeContent.getAll);
  const services = useQuery(api.services.list, {}) ?? [];
  const testimonials = useQuery(api.testimonials.list, {}) ?? [];

  const setHomeContent = useMutation(api.homeContent.set);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);
  const createTestimonial = useMutation(api.testimonials.create);
  const updateTestimonial = useMutation(api.testimonials.update);
  const removeTestimonial = useMutation(api.testimonials.remove);

  const [aboutText, setAboutText] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    if (homeContentList) {
      const aboutEntry = homeContentList.find((c: any) => c.key === "about_text");
      if (aboutEntry) {
        const value = aboutEntry.value;
        if (typeof value === "object" && value !== null && "ptBR" in value) {
          setAboutText(value.ptBR || "");
        } else {
          setAboutText(typeof value === "string" ? value : "");
        }
      }
    }
  }, [homeContentList]);

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "testimonial" && item) {
      setSelectedImage(item.imageUrl || "");
    } else {
      setSelectedImage("");
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setSelectedImage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      if (activeModal === "service") {
        const titlePT = formData.get("title") as string;
        const descriptionPT = formData.get("description") as string;

        const payload = {
          title: titlePT,
          description: descriptionPT,
          titleTranslations: { ptBR: titlePT, enUS: titlePT },
          descriptionTranslations: { ptBR: descriptionPT, enUS: descriptionPT },
        };

        if (editingItem) {
          await updateService({ id: editingItem._id as Id<"services">, ...payload });
        } else {
          await createService(payload);
        }
      } else if (activeModal === "testimonial") {
        const textPT = formData.get("text") as string;
        const namePT = formData.get("name") as string;
        const rolePT = formData.get("role") as string;

        const payload = {
          name: namePT,
          role: rolePT,
          roleTranslations: { ptBR: rolePT, enUS: rolePT },
          text: textPT,
          textTranslations: { ptBR: textPT, enUS: textPT },
          imageUrl: selectedImage || undefined,
        };

        if (editingItem) {
          await updateTestimonial({ id: editingItem._id as Id<"testimonials">, ...payload });
        } else {
          await createTestimonial(payload);
        }
      }

      handleCloseModal();
      toast.success("Salvo com sucesso!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar. Verifique o console.");
    }
  };

  const handleSaveAbout = async () => {
    try {
      await setHomeContent({
        key: "about_text",
        value: { ptBR: aboutText, enUS: aboutText },
      });
      toast.success("Sobre mim salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving about:", error);
      toast.error("Erro ao salvar 'Sobre Mim'.");
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      try {
        if (type === "service") {
          await removeService({ id: id as Id<"services"> });
        }
        if (type === "testimonial") {
          await removeTestimonial({ id: id as Id<"testimonials"> });
        }
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error("Erro ao excluir.");
      }
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

          <TabsContent value="about" className="space-y-8 mt-6">
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
                  <Button onClick={handleSaveAbout} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">O que eu faço</h2>
                <Button onClick={() => handleOpenModal("service")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(item => (
                  <Card key={item._id} className="bg-card border-white/10 group">
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        {item.titleTranslations?.ptBR || item.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {item.descriptionTranslations?.ptBR || item.description}
                      </p>
                      <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal("service", item)} className="text-white hover:text-neon-purple">
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("service", item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Depoimentos</h2>
              <Button onClick={() => handleOpenModal("testimonial")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Depoimento
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map(item => (
                <Card key={item._id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <p className="text-gray-400 text-xs">{item.roleTranslations?.ptBR || item.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">"{item.textTranslations?.ptBR || item.text}"</p>
                    <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal("testimonial", item)} className="text-white hover:text-neon-purple">
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete("testimonial", item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-background border-white/10 max-w-2xl">
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
                    <Input
                      name="title"
                      defaultValue={editingItem?.titleTranslations?.ptBR || editingItem?.title}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea
                      name="description"
                      defaultValue={editingItem?.descriptionTranslations?.ptBR || editingItem?.description}
                      className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    />
                  </div>
                </>
              )}

              {activeModal === "testimonial" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Nome</Label>
                      <Input name="name" defaultValue={editingItem?.name} className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Cargo/Empresa</Label>
                      <Input name="role" defaultValue={editingItem?.roleTranslations?.ptBR || editingItem?.role} className="bg-white/5 border-white/10 text-white" />
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
                        onSelect={(url) => setSelectedImage(Array.isArray(url) ? url[0] : url)}
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
                    <Textarea
                      name="text"
                      defaultValue={editingItem?.textTranslations?.ptBR || editingItem?.text}
                      className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    />
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
