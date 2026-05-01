import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Image as ImageIcon, GripVertical } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { BentoGridPreview } from "@/components/admin/BentoGridPreview";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";

type SpanSize = "1x1" | "1x2" | "2x1";

function SortableDailyRoutineCard({ item, onEdit, onDelete, t }: { item: any, onEdit: (item: any) => void, onDelete: (id: string) => void, t: (key: string) => string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card border-white/10 group">
        <CardContent className="pt-6 space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
            {item.image?.url && (
              <img src={item.image.url} alt={item.description} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-500 hover:text-white" />
              </div>
              {item.descriptionTranslations?.ptBR || item.description}
            </h3>
            <p className="text-gray-400 text-xs">
              {t('admin.about.spanSize')}: {item.spanSize}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="text-white hover:text-neon-purple">
              <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableFaqCard({ item, onEdit, onDelete, t }: { item: any, onEdit: (item: any) => void, onDelete: (id: string) => void, t: (key: string) => string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card border-white/10 group">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-move">
                <GripVertical className="w-4 h-4 text-gray-500 hover:text-white" />
              </div>
              {item.questionTranslations?.ptBR || item.question}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {item.answerTranslations?.ptBR || item.answer}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="text-white hover:text-neon-purple">
              <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
              <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAbout() {
  const { t } = useTranslation();
  const { translateFields, isTranslating } = useTranslateContent();

  const dailyRoutineData = useQuery(api.aboutDailyRoutine.list, {});
  const faqData = useQuery(api.aboutFaq.list, {});
  const dailyRoutine = dailyRoutineData ?? [];
  const faq = faqData ?? [];

  const createDailyRoutine = useMutation(api.aboutDailyRoutine.create);
  const updateDailyRoutine = useMutation(api.aboutDailyRoutine.update);
  const removeDailyRoutine = useMutation(api.aboutDailyRoutine.remove);
  const createFaq = useMutation(api.aboutFaq.create);
  const updateFaq = useMutation(api.aboutFaq.update);
  const removeFaq = useMutation(api.aboutFaq.remove);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [spanSize, setSpanSize] = useState<SpanSize>("1x1");

  const pickedImageQuery = useQuery(
    api.images.getById,
    selectedImageId && !selectedImageUrl ? { id: selectedImageId as Id<"imageMetadata"> } : "skip"
  );
  const displayImageUrl = pickedImageQuery?.url ?? selectedImageUrl;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "dailyRoutine" && item) {
      setSelectedImageId(item.imageId || "");
      setSelectedImageUrl(item.image?.url || "");
      setSpanSize((item.spanSize as SpanSize) || "1x1");
    } else {
      setSelectedImageId("");
      setSelectedImageUrl("");
      setSpanSize("1x1");
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setSelectedImageId("");
    setSelectedImageUrl("");
    setSpanSize("1x1");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      if (activeModal === "dailyRoutine") {
        const descriptionPT = formData.get("description") as string;
        const displayOrder = editingItem ? editingItem.displayOrder : dailyRoutine.length;

        const toastId = toast.loading('Traduzindo conteúdo...');
        const translated = await translateFields({ description: descriptionPT });
        toast.dismiss(toastId);
        const descriptionTranslations = { ptBR: descriptionPT, enUS: translated.description };

        if (editingItem) {
          await updateDailyRoutine({
            id: editingItem._id as Id<"aboutDailyRoutine">,
            imageId: selectedImageId ? (selectedImageId as Id<"imageMetadata">) : undefined,
            description: descriptionPT,
            descriptionTranslations,
            spanSize,
            displayOrder,
          });
        } else {
          if (!selectedImageId) {
            toast.error("Selecione uma imagem");
            return;
          }
          await createDailyRoutine({
            imageId: selectedImageId as Id<"imageMetadata">,
            description: descriptionPT,
            descriptionTranslations,
            spanSize,
            displayOrder,
          });
        }
      } else if (activeModal === "faq") {
        const questionPT = formData.get("question") as string;
        const answerPT = formData.get("answer") as string;
        const displayOrder = editingItem ? editingItem.displayOrder : faq.length;

        const toastId = toast.loading('Traduzindo conteúdo...');
        const translated = await translateFields({ question: questionPT, answer: answerPT });
        toast.dismiss(toastId);
        const questionTranslations = { ptBR: questionPT, enUS: translated.question };
        const answerTranslations = { ptBR: answerPT, enUS: translated.answer };

        if (editingItem) {
          await updateFaq({
            id: editingItem._id as Id<"aboutFaq">,
            question: questionPT,
            questionTranslations,
            answer: answerPT,
            answerTranslations,
            displayOrder,
          });
        } else {
          await createFaq({
            question: questionPT,
            questionTranslations,
            answer: answerPT,
            answerTranslations,
            displayOrder,
          });
        }
      }

      handleCloseModal();
      toast.success(t('admin.about.saveSuccess'));
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(t('admin.about.saveError'));
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm(t('admin.about.deleteConfirm'))) {
      try {
        if (type === "dailyRoutine") {
          await removeDailyRoutine({ id: id as Id<"aboutDailyRoutine"> });
        }
        if (type === "faq") {
          await removeFaq({ id: id as Id<"aboutFaq"> });
        }
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error(t('admin.about.deleteError'));
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent, type: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = type === "dailyRoutine" ? dailyRoutine : faq;
    const sortedItems = [...items].sort((a: any, b: any) => a.displayOrder - b.displayOrder);
    const oldIndex = sortedItems.findIndex((item: any) => item._id === active.id);
    const newIndex = sortedItems.findIndex((item: any) => item._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedItems, oldIndex, newIndex);

    try {
      if (type === "dailyRoutine") {
        await Promise.all(newOrder.map((item: any, index: number) =>
          updateDailyRoutine({ id: item._id as Id<"aboutDailyRoutine">, displayOrder: index })
        ));
      } else {
        await Promise.all(newOrder.map((item: any, index: number) =>
          updateFaq({ id: item._id as Id<"aboutFaq">, displayOrder: index })
        ));
      }
      toast.success("Ordem atualizada com sucesso");
    } catch (error) {
      console.error("Error reordering items:", error);
      toast.error("Erro ao reordenar itens");
    }
  };

  // Adapt for BentoGridPreview which expects { id, span_size, display_order }
  const previewItems = dailyRoutine.map((item: any) => ({
    id: item._id,
    span_size: item.spanSize,
    display_order: item.displayOrder,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('admin.about.title')}</h1>
        </div>

        <Tabs defaultValue="dailyRoutine" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 w-full grid grid-cols-2">
            <TabsTrigger value="dailyRoutine">{t('admin.about.dailyRoutine')}</TabsTrigger>
            <TabsTrigger value="faq">{t('admin.about.faq')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dailyRoutine" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t('admin.about.dailyRoutine')}</h2>
              <Button onClick={() => handleOpenModal("dailyRoutine")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> {t('admin.about.addDailyRoutine')}
              </Button>
            </div>

            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Preview do Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'dailyRoutine')}>
                  <SortableContext items={dailyRoutine.map((i: any) => i._id)} strategy={rectSortingStrategy}>
                    <BentoGridPreview items={previewItems as any} />
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'dailyRoutine')}>
              <SortableContext items={dailyRoutine.map((i: any) => i._id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dailyRoutine.map((item: any) => (
                    <SortableDailyRoutineCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("dailyRoutine", item)}
                      onDelete={(id) => handleDelete("dailyRoutine", id)}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t('admin.about.faq')}</h2>
              <Button onClick={() => handleOpenModal("faq")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> {t('admin.about.addFaq')}
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'faq')}>
              <SortableContext items={faq.map((i: any) => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {faq.map((item: any) => (
                    <SortableFaqCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("faq", item)}
                      onDelete={(id) => handleDelete("faq", id)}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>
        </Tabs>

        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-background border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? t('common.edit') : t('common.add')} {activeModal === "dailyRoutine" ? t('admin.about.dailyRoutine') : t('admin.about.faq')}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {activeModal === "dailyRoutine"
                  ? t('admin.about.editDailyRoutine')
                  : t('admin.about.editFaq')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {activeModal === "dailyRoutine" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.imageUrl')}</Label>
                    <div className="flex items-center gap-4">
                      {displayImageUrl && (
                        <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                          <img src={displayImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <ImagePicker
                        onSelect={(value) => {
                          const v = Array.isArray(value) ? value[0] : value;
                          setSelectedImageId(v);
                          setSelectedImageUrl("");
                        }}
                        trigger={
                          <Button type="button" variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {displayImageUrl ? t('admin.home.changeImage') : t('admin.home.selectImage')}
                          </Button>
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.description')}</Label>
                    <Textarea
                      name="description"
                      defaultValue={editingItem?.descriptionTranslations?.ptBR || editingItem?.description}
                      className="bg-white/5 border-white/10 text-white min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">{t('admin.about.spanSize')}</Label>
                      <Select value={spanSize} onValueChange={(v) => setSpanSize(v as SpanSize)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1x1">1x1</SelectItem>
                          <SelectItem value="1x2">1x2</SelectItem>
                          <SelectItem value="2x1">2x1</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="spanSize" value={spanSize} />
                    </div>
                  </div>
                </>
              )}

              {activeModal === "faq" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.question')}</Label>
                    <Input
                      name="question"
                      defaultValue={editingItem?.questionTranslations?.ptBR || editingItem?.question}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.answer')}</Label>
                    <Textarea
                      name="answer"
                      defaultValue={editingItem?.answerTranslations?.ptBR || editingItem?.answer}
                      className="bg-white/5 border-white/10 text-white min-h-[150px]"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-gray-400">{t('common.cancel')}</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : t('common.save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
