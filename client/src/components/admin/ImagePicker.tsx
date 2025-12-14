import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Check, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ImagePickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

export function ImagePicker({ onSelect, trigger, multiple = false }: ImagePickerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
    }
  }, [isOpen]);

  const handleSelect = (url: string) => {
    setSelectedImage(url);
    if (!multiple) {
      onSelect(url);
      setIsOpen(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert("Você precisa estar autenticado para fazer upload de imagens.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Garantir que o contentType está correto
      const contentType = file.type || `image/${fileExt?.toLowerCase()}`;
      
      const { error } = await supabase.storage
        .from("portfolio-images")
        .upload(fileName, file, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600'
        });

      if (error) {
        // Mensagem de erro mais específica
        if (error.message.includes('mime type') || error.message.includes('not supported')) {
          alert(`Erro: O tipo de arquivo ${contentType} não é suportado pelo bucket.\n\nVerifique as configurações do bucket "portfolio-images" no Supabase Dashboard:\n1. Vá em Storage > Policies\n2. Certifique-se de que a política permite uploads de imagens (image/* ou tipos específicos como image/png, image/jpeg)\n3. Verifique se você está autenticado e tem permissão para fazer upload.`);
        } else {
          alert(`Erro ao fazer upload: ${error.message}`);
        }
        throw error;
      }

      await fetchImages();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      // Não mostrar alerta duplicado se já foi mostrado acima
      if (!error.message?.includes('mime type') && !error.message?.includes('not supported')) {
        alert("Erro ao fazer upload da imagem. Verifique o console para mais detalhes.");
      }
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
      <DialogContent className="bg-black border-white/10 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Galeria de Imagens</DialogTitle>
          <VisuallyHidden>
            <h2>Selecione uma imagem da galeria</h2>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
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
              {isUploading ? "Enviando..." : "Upload Nova Imagem"}
            </Button>
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
                images.map((img, index) => (
                  <div
                    key={index}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                      selectedImage === img.url ? "border-neon-purple" : "border-transparent hover:border-white/20"
                    )}
                    onClick={() => handleSelect(img.url)}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    {selectedImage === img.url && (
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
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
