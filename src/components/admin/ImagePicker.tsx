import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Trash2, 
  Loader2, 
  Search,
  FolderPlus,
  Folder,
  Edit2,
  Tag,
  X,
  ChevronRight,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ImagePickerProps {
  onSelect: (url: string | string[]) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

interface ImageFolder {
  id: string;
  name: string;
  path: string;
  parent_id: string | null;
}

interface ImageMetadata {
  id: string;
  storage_path: string;
  display_name: string | null;
  description: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  folder_id: string | null;
  folder_name: string | null;
  folder_path: string | null;
  tags: string[];
  url: string;
}

export function ImagePicker({ onSelect, trigger, multiple = false }: ImagePickerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<ImageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingImage, setEditingImage] = useState<ImageMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar imagens e pastas
  const fetchData = async (folderId: string | null = null) => {
    setIsLoading(true);
    try {
      // Buscar pastas na pasta atual
      const foldersQuery = folderId
        ? supabase
            .from("image_folders")
            .select("*")
            .eq("parent_id", folderId)
            .order("name")
        : supabase
            .from("image_folders")
            .select("*")
            .is("parent_id", null)
            .order("name");

      // Buscar imagens
      let imagesQuery = folderId
        ? supabase
            .from("image_metadata_view")
            .select("*")
            .eq("folder_id", folderId)
            .order("created_at", { ascending: false })
        : supabase
            .from("image_metadata_view")
            .select("*")
            .is("folder_id", null)
            .order("created_at", { ascending: false });

      // Se há busca, usar função de busca
      if (searchQuery.trim()) {
        const { data: searchData, error: searchError } = await supabase
          .rpc("search_images", {
            search_query: searchQuery.trim() || null,
            folder_id_filter: folderId,
            tag_ids_filter: null,
            limit_count: 100,
            offset_count: 0
          });

        if (searchError) throw searchError;
        setImages((searchData || []).map(img => ({
          ...img,
          url: supabase.storage.from("portfolio-images").getPublicUrl(img.storage_path).data.publicUrl
        })));
        setFolders([]); // Não mostrar pastas durante busca
      } else {
        const [foldersResult, imagesResult] = await Promise.all([
          foldersQuery,
          imagesQuery
        ]);

        if (foldersResult.error) throw foldersResult.error;
        if (imagesResult.error) throw imagesResult.error;

        setFolders(foldersResult.data || []);
        setImages((imagesResult.data || []).map(img => ({
          ...img,
          url: supabase.storage.from("portfolio-images").getPublicUrl(img.storage_path).data.publicUrl
        })));
      }

      // Buscar breadcrumbs se houver pasta atual
      if (folderId) {
        const { data: breadcrumbsData, error: breadcrumbsError } = await supabase
          .rpc("get_folder_breadcrumbs", { folder_id: folderId });

        if (!breadcrumbsError && breadcrumbsData) {
          setBreadcrumbs(breadcrumbsData.reverse());
        }
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Erro ao carregar imagens e pastas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData(currentFolderId);
      setSelectedImages([]);
      setSelectedImage(null);
      setSearchQuery("");
    }
  }, [isOpen, currentFolderId]);

  // Debounce para busca
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      fetchData(currentFolderId);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (image: ImageMetadata) => {
    if (multiple) {
      setSelectedImages(prev => {
        if (prev.includes(image.url)) {
          return prev.filter(url => url !== image.url);
        } else {
          return [...prev, image.url];
        }
      });
    } else {
      setSelectedImage(image.url);
      onSelect(image.url);
      setIsOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    if (multiple && selectedImages.length > 0) {
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
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`A imagem ${file.name} deve ter no máximo 2MB.`);
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Construir path baseado na pasta atual
        let storagePath = fileName;
        if (currentFolderId) {
          // Buscar path da pasta atual
          const { data: folderData } = await supabase
            .from("image_folders")
            .select("path")
            .eq("id", currentFolderId)
            .single();
          
          if (folderData?.path) {
            storagePath = `${folderData.path}/${fileName}`;
          }
        }

        // Upload para storage
        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
            cacheControl: '3600'
          });

        if (uploadError) throw uploadError;

        // Criar metadados
        const { error: metadataError } = await supabase
          .from("image_metadata")
          .insert({
            storage_path: storagePath,
            display_name: file.name,
            folder_id: currentFolderId,
            mime_type: file.type,
            file_size: file.size,
            created_by: user.id
          });

        if (metadataError) throw metadataError;
      });

      await Promise.all(uploadPromises);
      await fetchData(currentFolderId);
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

  const handleDelete = async (e: React.MouseEvent, image: ImageMetadata) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from("portfolio-images")
        .remove([image.storage_path]);

      if (storageError) throw storageError;

      // Remover metadados (cascade remove relações de tags)
      const { error: metadataError } = await supabase
        .from("image_metadata")
        .delete()
        .eq("id", image.id);

      if (metadataError) throw metadataError;

      await fetchData(currentFolderId);
      if (selectedImage === image.url) {
        setSelectedImage(null);
      }
      if (multiple) {
        setSelectedImages(prev => prev.filter(url => url !== image.url));
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Erro ao excluir imagem.");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .rpc("create_image_folder", {
          folder_name: newFolderName.trim(),
          parent_folder_id: currentFolderId,
          created_by_user: user?.id || null
        });

      if (error) throw error;

      setNewFolderName("");
      setShowCreateFolder(false);
      await fetchData(currentFolderId);
    } catch (error: any) {
      console.error("Error creating folder:", error);
      alert(`Erro ao criar pasta: ${error.message}`);
    }
  };

  const handleFolderClick = (folder: ImageFolder) => {
    setCurrentFolderId(folder.id);
    setSearchQuery(""); // Limpar busca ao navegar
  };

  const handleBreadcrumbClick = (folder: ImageFolder | null) => {
    setCurrentFolderId(folder?.id || null);
    setSearchQuery("");
  };

  const handleUpdateImageMetadata = async (updates: Partial<ImageMetadata>) => {
    if (!editingImage) return;

    try {
      const { error } = await supabase
        .from("image_metadata")
        .update({
          display_name: updates.display_name,
          description: updates.description,
          alt_text: updates.alt_text
        })
        .eq("id", editingImage.id);

      if (error) throw error;

      setEditingImage(null);
      await fetchData(currentFolderId);
    } catch (error: any) {
      console.error("Error updating image:", error);
      alert(`Erro ao atualizar imagem: ${error.message}`);
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
      <DialogContent className="bg-background border-white/10 max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Galeria de Imagens</DialogTitle>
          <VisuallyHidden>
            <h2>Selecione uma imagem da galeria</h2>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Barra de busca e ações */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar imagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-white/10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="border-white/10"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nova Pasta
            </Button>
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
              size="sm"
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
                size="sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar ({selectedImages.length})
              </Button>
            )}
          </div>

          {/* Criar pasta */}
          {showCreateFolder && (
            <div className="flex gap-2 items-center p-3 bg-white/5 rounded-lg">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowCreateFolder(false);
                }}
                className="flex-1 bg-background/50 border-white/10"
                autoFocus
              />
              <Button onClick={handleCreateFolder} size="sm">Criar</Button>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)} size="sm">Cancelar</Button>
            </div>
          )}

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-400 flex-wrap">
              <button
                onClick={() => handleBreadcrumbClick(null)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span>Raiz</span>
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  <button
                    onClick={() => handleBreadcrumbClick(crumb)}
                    className="hover:text-white transition-colors"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Conteúdo: pastas e imagens */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Pastas */}
                {!searchQuery && folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-white/20 transition-all group bg-white/5 flex flex-col items-center justify-center"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <Folder className="w-12 h-12 text-neon-purple mb-2" />
                    <span className="text-sm text-center px-2 truncate w-full">{folder.name}</span>
                  </div>
                ))}

                {/* Imagens */}
                {images.map((img) => {
                  const isSelected = multiple
                    ? selectedImages.includes(img.url)
                    : selectedImage === img.url;

                  return (
                    <div
                      key={img.id}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                        isSelected ? "border-neon-purple" : "border-transparent hover:border-white/20"
                      )}
                      onClick={() => handleSelect(img)}
                    >
                      <img 
                        src={img.url} 
                        alt={img.display_name || img.storage_path} 
                        className="w-full h-full object-cover" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-neon-purple/20 flex items-center justify-center">
                          <div className="bg-neon-purple rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 bg-blue-500/80 rounded-full hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingImage(img);
                          }}
                        >
                          <Edit2 className="w-3 h-3 text-white" />
                        </button>
                        <button
                          className="p-1 bg-red-500/80 rounded-full hover:bg-red-600"
                          onClick={(e) => handleDelete(e, img)}
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      {img.tags && img.tags.length > 0 && (
                        <div className="absolute bottom-1 left-1 flex gap-1 flex-wrap">
                          {img.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mensagem vazia */}
                {!searchQuery && folders.length === 0 && images.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-10">
                    Nenhuma imagem ou pasta encontrada.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dialog de edição de imagem */}
        {editingImage && (
          <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
            <DialogContent className="bg-background border-white/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nome de Exibição</label>
                  <Input
                    value={editingImage.display_name || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, display_name: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Descrição</label>
                  <Input
                    value={editingImage.description || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Texto Alternativo (Alt)</label>
                  <Input
                    value={editingImage.alt_text || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, alt_text: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingImage(null)}>Cancelar</Button>
                  <Button onClick={() => handleUpdateImageMetadata(editingImage)}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
