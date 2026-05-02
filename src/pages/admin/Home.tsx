

import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";

export default function AdminHome() {
  const homeContentList = useQuery(api.homeContent.getAll);
  const services = useQuery(api.services.list, {}) ?? [];

  const setHomeContent = useMutation(api.homeContent.set);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);

  const { translateFields, isTranslating } = useTranslateContent();
  const [aboutText, setAboutText] = useState("");
  const [availabilityEnabled, setAvailabilityEnabled] = useState(false);
  const [availabilityLabelPT, setAvailabilityLabelPT] = useState("");
  const [availabilityLabelEN, setAvailabilityLabelEN] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

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

      const availabilityEntry = homeContentList.find((c: any) => c.key === "availability_status");
      if (availabilityEntry) {
        const v = availabilityEntry.value ?? {};
        setAvailabilityEnabled(Boolean(v.available));
        setAvailabilityLabelPT(v.label?.ptBR ?? "");
        setAvailabilityLabelEN(v.label?.enUS ?? "");
      }
    }
  }, [homeContentList]);

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      if (activeModal === "service") {
        const titlePT = formData.get("title") as string;
        const descriptionPT = formData.get("description") as string;

        const serviceFields = { title: titlePT, description: descriptionPT };
        const changedService = editingItem
          ? getChangedTranslatableFields(serviceFields, { title: editingItem.titleTranslations, description: editingItem.descriptionTranslations })
          : serviceFields;

        let partialService: Record<string, string> = {};
        if (Object.keys(changedService).length > 0) {
          const toastId = toast.loading('Traduzindo conteúdo...');
          partialService = await translateFields(changedService);
          toast.dismiss(toastId);
        }
        const translated = {
          title: partialService.title ?? editingItem?.titleTranslations?.enUS ?? titlePT,
          description: partialService.description ?? editingItem?.descriptionTranslations?.enUS ?? descriptionPT,
        };

        const payload = {
          title: titlePT,
          description: descriptionPT,
          titleTranslations: { ptBR: titlePT, enUS: translated.title },
          descriptionTranslations: { ptBR: descriptionPT, enUS: translated.description },
        };

        if (editingItem) {
          await updateService({ id: editingItem._id as Id<"services">, ...payload });
        } else {
          await createService(payload);
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
      const aboutEntry = homeContentList?.find((c: any) => c.key === "about_text");
      const savedPT = typeof aboutEntry?.value === "object" && aboutEntry?.value !== null
        ? (aboutEntry.value as any).ptBR ?? ""
        : (typeof aboutEntry?.value === "string" ? aboutEntry.value : "");
      const savedEN = typeof aboutEntry?.value === "object" && aboutEntry?.value !== null
        ? (aboutEntry.value as any).enUS ?? ""
        : "";

      let enUS: string;
      if (aboutText.trim() !== savedPT.trim()) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        const translated = await translateFields({ aboutText });
        toast.dismiss(toastId);
        enUS = translated.aboutText;
      } else {
        enUS = savedEN || aboutText;
      }

      await setHomeContent({
        key: "about_text",
        value: { ptBR: aboutText, enUS },
      });
      toast.success("Sobre mim salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving about:", error);
      toast.error("Erro ao salvar 'Sobre Mim'.");
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await setHomeContent({
        key: "availability_status",
        value: {
          available: availabilityEnabled,
          label: {
            ptBR: availabilityLabelPT || "disponível para novos projetos",
            enUS: availabilityLabelEN || "available for new projects",
          },
        },
      });
      toast.success("Disponibilidade salva com sucesso!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Erro ao salvar disponibilidade.");
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      try {
        if (type === "service") {
          await removeService({ id: id as Id<"services"> });
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
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
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
                  <Button onClick={handleSaveAbout} disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                    {isTranslating ? 'Traduzindo...' : 'Salvar'}
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

          <TabsContent value="availability" className="space-y-6 mt-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-neon-lime" />
                  Badge de Disponibilidade
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Controla o badge exibido na home indicando disponibilidade para novos projetos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-white font-medium">Status de disponibilidade</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {availabilityEnabled
                        ? "Badge visível na home (disponível)"
                        : "Badge oculto na home (indisponível)"}
                    </p>
                  </div>
                  <Switch
                    checked={availabilityEnabled}
                    onCheckedChange={setAvailabilityEnabled}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Mensagem (Português)</Label>
                    <Input
                      value={availabilityLabelPT}
                      onChange={(e) => setAvailabilityLabelPT(e.target.value)}
                      placeholder="disponível para novos projetos"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Mensagem (English)</Label>
                    <Input
                      value={availabilityLabelEN}
                      onChange={(e) => setAvailabilityLabelEN(e.target.value)}
                      placeholder="available for new projects"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {availabilityEnabled && (
                  <div className="p-4 bg-neon-lime/5 border border-neon-lime/20 rounded-lg">
                    <p className="text-neon-lime text-xs font-mono mb-2">Preview:</p>
                    <div className="inline-flex items-center px-4 py-1.5 bg-neon-lime/10 border border-neon-lime/30 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-neon-lime mr-2" />
                      <span className="text-neon-lime text-sm font-mono">
                        {availabilityLabelPT || "disponível para novos projetos"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAvailability}
                    className="bg-neon-purple hover:bg-neon-purple/90 text-white"
                  >
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-background border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? "Editar" : "Adicionar"} Serviço
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de edição</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
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
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-gray-400">Cancelar</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
