import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function AdminAbout() {
  const { t } = useTranslation();
  const [dailyRoutine, setDailyRoutine] = useState<any[]>([]);
  const [faq, setFaq] = useState<any[]>([]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [spanSize, setSpanSize] = useState<string>("1x1");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Daily Routine Items
      const { data: dailyData, error: dailyError } = await supabase
        .schema('app_portfolio')
        .from('daily_routine_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (dailyError) {
        console.error('Error fetching daily routine:', dailyError);
      } else if (dailyData) {
        setDailyRoutine(dailyData);
      }

      // Fetch FAQ Items
      const { data: faqData, error: faqError } = await supabase
        .schema('app_portfolio')
        .from('faq_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (faqError) {
        console.error('Error fetching FAQ:', faqError);
      } else if (faqData) {
        setFaq(faqData);
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
    }
  };

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "dailyRoutine" && item) {
      setSelectedImage(item.image_url || "");
      setTags(item.tags || []);
      setSpanSize(item.span_size || "1x1");
    } else {
      setSelectedImage("");
      setTags([]);
      setSpanSize("1x1");
    }
    setTagInput("");
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setSelectedImage("");
    setTags([]);
    setTagInput("");
    setSpanSize("1x1");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      if (activeModal === "dailyRoutine") {
        const descriptionPT = formData.get("description") as string;
        const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;

        // Traduz descrição usando a Edge Function
        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
          body: {
            texts: [descriptionPT],
            source: 'pt',
            target: 'en',
          },
        });

        if (translateError) {
          console.error('Translation error:', translateError);
          alert('Erro ao traduzir. Salvando apenas em português.');
        }

        const translatedTexts = translateData?.translatedTexts || [descriptionPT];
        const descriptionEN = translatedTexts[0] || descriptionPT;

        const data = {
          image_url: selectedImage,
          tags: tags,
          description: descriptionPT,
          description_translations: {
            'pt-BR': descriptionPT,
            'en-US': descriptionEN,
          },
          span_size: spanSize,
          display_order: displayOrder,
        };

        if (editingItem) {
          await supabase.schema('app_portfolio').from('daily_routine_items').update(data).eq('id', editingItem.id);
        } else {
          await supabase.schema('app_portfolio').from('daily_routine_items').insert(data);
        }
      } else if (activeModal === "faq") {
        const questionPT = formData.get("question") as string;
        const answerPT = formData.get("answer") as string;
        const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;

        // Traduz pergunta e resposta usando a Edge Function
        const { data: translateData, error: translateError } = await supabase.functions.invoke('translate-and-save', {
          body: {
            texts: [questionPT, answerPT],
            source: 'pt',
            target: 'en',
          },
        });

        if (translateError) {
          console.error('Translation error:', translateError);
          alert('Erro ao traduzir. Salvando apenas em português.');
        }

        const translatedTexts = translateData?.translatedTexts || [questionPT, answerPT];
        const questionEN = translatedTexts[0] || questionPT;
        const answerEN = translatedTexts[1] || answerPT;

        const data = {
          question: questionPT,
          question_translations: {
            'pt-BR': questionPT,
            'en-US': questionEN,
          },
          answer: answerPT,
          answer_translations: {
            'pt-BR': answerPT,
            'en-US': answerEN,
          },
          display_order: displayOrder,
        };

        if (editingItem) {
          await supabase.schema('app_portfolio').from('faq_items').update(data).eq('id', editingItem.id);
        } else {
          await supabase.schema('app_portfolio').from('faq_items').insert(data);
        }
      }

      await fetchData();
      handleCloseModal();
      alert(t('admin.about.saveSuccess'));
    } catch (error) {
      console.error("Error saving:", error);
      alert(t('admin.about.saveError'));
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (confirm(t('admin.about.deleteConfirm'))) {
      try {
        if (type === "dailyRoutine") {
          await supabase.schema('app_portfolio').from('daily_routine_items').delete().eq('id', id);
        }
        if (type === "faq") {
          await supabase.schema('app_portfolio').from('faq_items').delete().eq('id', id);
        }
        await fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        alert(t('admin.about.deleteError'));
      }
    }
  };

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyRoutine.map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                      <img src={item.image_url} alt={item.description} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.description_translations?.['pt-BR'] || item.description}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.tags?.map((tag: string, idx: number) => (
                          <Badge key={idx} className="bg-neon-purple/20 text-neon-purple border-none text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-gray-400 text-xs">
                        {t('admin.about.spanSize')}: {item.span_size} | {t('admin.about.displayOrder')}: {item.display_order}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal("dailyRoutine", item)} className="text-white hover:text-neon-purple">
                        <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete("dailyRoutine", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t('admin.about.faq')}</h2>
              <Button onClick={() => handleOpenModal("faq")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> {t('admin.about.addFaq')}
              </Button>
            </div>

            <div className="space-y-4">
              {faq.map(item => (
                <Card key={item.id} className="bg-card border-white/10 group">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {item.question_translations?.['pt-BR'] || item.question}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {item.answer_translations?.['pt-BR'] || item.answer}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {t('admin.about.displayOrder')}: {item.display_order}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal("faq", item)} className="text-white hover:text-neon-purple">
                        <Pencil className="w-4 h-4 mr-2" /> {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete("faq", item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                      {selectedImage && (
                        <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <ImagePicker
                        onSelect={(url) => setSelectedImage(Array.isArray(url) ? url[0] : url)}
                        trigger={
                          <Button type="button" variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {selectedImage ? t('admin.home.changeImage') : t('admin.home.selectImage')}
                          </Button>
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.tags')}</Label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {tags.map((tag, idx) => (
                        <Badge key={idx} className="bg-neon-purple/20 text-neon-purple border-none">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Digite uma tag e pressione Enter"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                        {t('common.add')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.description')}</Label>
                    <Textarea
                      name="description"
                      defaultValue={editingItem?.description_translations?.['pt-BR'] || editingItem?.description}
                      className="bg-white/5 border-white/10 text-white min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">{t('admin.about.spanSize')}</Label>
                      <Select value={spanSize} onValueChange={setSpanSize}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1x1">1x1</SelectItem>
                          <SelectItem value="1x2">1x2</SelectItem>
                          <SelectItem value="2x1">2x1</SelectItem>
                          <SelectItem value="2x2">2x2</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="spanSize" value={spanSize} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">{t('admin.about.displayOrder')}</Label>
                      <Input
                        name="displayOrder"
                        type="number"
                        defaultValue={editingItem?.display_order || 0}
                        className="bg-white/5 border-white/10 text-white"
                      />
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
                      defaultValue={editingItem?.question_translations?.['pt-BR'] || editingItem?.question}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.answer')}</Label>
                    <Textarea
                      name="answer"
                      defaultValue={editingItem?.answer_translations?.['pt-BR'] || editingItem?.answer}
                      className="bg-white/5 border-white/10 text-white min-h-[150px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">{t('admin.about.displayOrder')}</Label>
                    <Input
                      name="displayOrder"
                      type="number"
                      defaultValue={editingItem?.display_order || 0}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-gray-400">{t('common.cancel')}</Button>
                <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">{t('common.save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

