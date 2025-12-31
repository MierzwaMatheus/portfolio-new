

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
import { supabase } from "@/lib/supabase";

export default function AdminHome() {
  const [aboutText, setAboutText] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch About - value é JSONB
      const { data: aboutData, error: aboutError } = await supabase.schema('app_portfolio').from('content').select('value').eq('key', 'about_text').single();
      if (aboutError) {
        console.error('Error fetching about:', aboutError);
      } else if (aboutData) {
        const value = aboutData.value;
        if (typeof value === 'object' && value !== null && 'pt-BR' in value) {
          setAboutText(value['pt-BR'] || '');
        } else {
          setAboutText(typeof value === 'string' ? value : '');
        }
      }

      const { data: servicesData, error: servicesError } = await supabase.schema('app_portfolio').from('services').select('*').order('created_at');
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else if (servicesData) {
        setServices(servicesData);
      }

      const { data: testimonialsData, error: testimonialsError } = await supabase.schema('app_portfolio').from('testimonials').select('*').order('created_at');
      if (testimonialsError) {
        console.error('Error fetching testimonials:', testimonialsError);
      } else if (testimonialsData) {
        setTestimonials(testimonialsData);
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
    }
  };

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "testimonial" && item) {
      setSelectedImage(item.image_url || item.image || "");
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

        // Traduz para inglês usando a Edge Function
        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
          body: {
            texts: [titlePT, descriptionPT],
            source: 'pt',
            target: 'en',
          },
        });

        if (translateError) {
          console.error('Translation error:', translateError);
          alert('Erro ao traduzir. Salvando apenas em português.');
        }

        const translatedTexts = translateData?.translatedTexts || [titlePT, descriptionPT];
        const titleEN = translatedTexts[0] || titlePT;
        const descriptionEN = translatedTexts[1] || descriptionPT;

        const data = {
          title: titlePT,
          description: descriptionPT,
          title_translations: {
            'pt-BR': titlePT,
            'en-US': titleEN,
          },
          description_translations: {
            'pt-BR': descriptionPT,
            'en-US': descriptionEN,
          },
        };

        if (editingItem) {
          await supabase.schema('app_portfolio').from('services').update(data).eq('id', editingItem.id);
        } else {
          await supabase.schema('app_portfolio').from('services').insert(data);
        }
      } else if (activeModal === "testimonial") {
        const textPT = formData.get("text") as string;

        // Traduz apenas o texto do depoimento usando a Edge Function
        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
          body: {
            texts: [textPT],
            source: 'pt',
            target: 'en',
          },
        });

        if (translateError) {
          console.error('Translation error:', translateError);
          alert('Erro ao traduzir. Salvando apenas em português.');
        }

        const translatedTexts = translateData?.translatedTexts || [textPT];
        const textEN = translatedTexts[0] || textPT;

        const data = {
          name: formData.get("name"),
          role: formData.get("role"),
          text: textPT,
          image_url: selectedImage,
          text_translations: {
            'pt-BR': textPT,
            'en-US': textEN,
          },
        };

        if (editingItem) {
          await supabase.schema('app_portfolio').from('testimonials').update(data).eq('id', editingItem.id);
        } else {
          await supabase.schema('app_portfolio').from('testimonials').insert(data);
        }
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao salvar. Verifique o console.");
    }
  };

  const handleSaveAbout = async () => {
    try {
      // Traduz para inglês usando a Edge Function
      const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
        body: {
          texts: [aboutText],
          source: 'pt',
          target: 'en',
        },
      });

      if (translateError) {
        console.error('Translation error:', translateError);
        alert('Erro ao traduzir. Salvando apenas em português.');
      }

      const translatedTexts = translateData?.translatedTexts || [aboutText];
      const aboutEN = translatedTexts[0] || aboutText;

      // Salva em JSONB
      const { error } = await supabase.schema('app_portfolio').from('content').upsert({
        key: 'about_text',
        value: {
          'pt-BR': aboutText,
          'en-US': aboutEN,
        }
      });

      if (error) {
        console.error("Error saving about:", error);
        alert(`Erro ao salvar 'Sobre Mim': ${error.message}`);
        throw error;
      }
      alert("Sobre mim salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving about:", error);
      if (!error.message) {
        alert("Erro ao salvar 'Sobre Mim'. Verifique o console.");
      }
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      try {
        if (type === "service") {
          await supabase.schema('app_portfolio').from('services').delete().eq('id', id);
        }
        if (type === "testimonial") {
          await supabase.schema('app_portfolio').from('testimonials').delete().eq('id', id);
        }
        await fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Erro ao excluir.");
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
                  <Card key={item.id} className="bg-card border-white/10 group">
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        {item.title_translations?.['pt-BR'] || item.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {item.description_translations?.['pt-BR'] || item.description}
                      </p>
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
                        <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <p className="text-gray-400 text-xs">{item.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">"{item.text_translations?.['pt-BR'] || item.text}"</p>
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
                      defaultValue={editingItem?.title_translations?.['pt-BR'] || editingItem?.title} 
                      className="bg-white/5 border-white/10 text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea 
                      name="description" 
                      defaultValue={editingItem?.description_translations?.['pt-BR'] || editingItem?.description} 
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
                      <Input name="role" defaultValue={editingItem?.role} className="bg-white/5 border-white/10 text-white" />
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
                      defaultValue={editingItem?.text_translations?.['pt-BR'] || editingItem?.text} 
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
