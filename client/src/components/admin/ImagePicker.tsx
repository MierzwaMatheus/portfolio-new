import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImagePickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

// Mock images for now
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2670&auto=format&fit=crop",
];

export function ImagePicker({ onSelect, trigger, multiple = false }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSelect = (url: string) => {
    setSelectedImage(url);
    if (!multiple) {
      onSelect(url);
      setIsOpen(false);
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
            <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload Nova Imagem
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1">
            {MOCK_IMAGES.map((url, index) => (
              <div 
                key={index}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                  selectedImage === url ? "border-neon-purple" : "border-transparent hover:border-white/20"
                )}
                onClick={() => handleSelect(url)}
              >
                <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                {selectedImage === url && (
                  <div className="absolute inset-0 bg-neon-purple/20 flex items-center justify-center">
                    <div className="bg-neon-purple rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
