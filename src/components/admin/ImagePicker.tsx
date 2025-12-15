import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Check, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ImagePickerProps {
  onSelect: (url: string | string[]) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

export function ImagePicker({ onSelect, trigger, multiple = false }: ImagePickerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("portfolio-images")
        .list();

      if (error) {
        console.error("Error fetching images:", error);
        return;
      }

      const imageUrls = data
        .filter((item) => item.name !== ".emptyFolderPlaceholder")
        .map((item) => {
          const { data: publicUrlData } = supabase.storage
            .from("portfolio-images")
            .getPublicUrl(item.name);

          return {
            name: item.name,
            url: publicUrlData.publicUrl
          };
        });

      setImages(imageUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
      setSelectedImages([]);
      setSelectedImage(null);
    }
  }, [isOpen]);

  const handleSelect = (url: string) => {
    if (multiple) {
      setSelectedImages(prev => {
        if (prev.includes(url)) {
          return prev.filter(img => img !== url);
        } else {
          return [...prev, url];
        }
      });
    } else {
      setSelectedImage(url);
      onSelect(url);
      setIsOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    if (multiple) {
      // @ts-ignore - onSelect expects string | string[] but TS might infer just string based on usage elsewhere
      onSelect(selectedImages);
      setIsOpen(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      alert("Você precisa estar autenticado para fazer upload de imagens.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 2 * 1024 * 1024) { // 2MB
          throw new Error(`A imagem ${file.name} deve ter no máximo 2MB.`);
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const contentType = file.type || `image/${fileExt?.toLowerCase()}`;

        const { error } = await supabase.storage
          .from("portfolio-images")
          .upload(fileName, file, {
            contentType: contentType,
            upsert: false,
            cacheControl: '3600'
          });

        if (error) throw error;
      });

      await Promise.all(uploadPromises);
      await fetchImages();
    } catch (error: any) {
      console.error("Error uploading images:", error);
      alert(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, imageName: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      const { error } = await supabase.storage
        .from("portfolio-images")
        .remove([imageName]);

      if (error) {
        throw error;
      }

      await fetchImages();
      if (selectedImage && selectedImage.includes(imageName)) {
        setSelectedImage(null);
      }
      if (multiple) {
        setSelectedImages(prev => prev.filter(url => !url.includes(imageName)));
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Erro ao excluir imagem.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <ImageIcon className="w-4 h-4 mr-2" />
            Selecionar Imagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background border-white/10 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Galeria de Imagens</DialogTitle>
          <VisuallyHidden>
            <h2>Selecione uma imagem da galeria</h2>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {multiple && (
                <span>{selectedImages.length} imagem(ns) selecionada(s)</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <Button
                className="bg-neon-purple hover:bg-neon-purple/90 text-white"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? "Enviando..." : "Upload"}
              </Button>
              {multiple && selectedImages.length > 0 && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmSelection}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1">
              {images.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-10">
                  Nenhuma imagem encontrada.
                </div>
              ) : (
                images.map((img, index) => {
                  const isSelected = multiple
                    ? selectedImages.includes(img.url)
                    : selectedImage === img.url;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                        isSelected ? "border-neon-purple" : "border-transparent hover:border-white/20"
                      )}
                      onClick={() => handleSelect(img.url)}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-neon-purple/20 flex items-center justify-center">
                          <div className="bg-neon-purple rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <button
                        className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        onClick={(e) => handleDelete(e, img.name)}
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
