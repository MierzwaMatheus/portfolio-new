import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Home,
  Move,
  Maximize2,
  Info
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
  created_at?: string;
}

export function ImagePicker({ onSelect, trigger, multiple: initialMultiple = false }: ImagePickerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [multipleMode, setMultipleMode] = useState(initialMultiple);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<ImageFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<ImageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingImage, setEditingImage] = useState<ImageMetadata | null>(null);
  const [viewingImage, setViewingImage] = useState<ImageMetadata | null>(null);
  const [movingImage, setMovingImage] = useState<ImageMetadata | null>(null);
  const [movingImages, setMovingImages] = useState<ImageMetadata[]>([]);
  const [allFolders, setAllFolders] = useState<ImageFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar modo multiple quando a prop mudar
  useEffect(() => {
    setMultipleMode(initialMultiple);
  }, [initialMultiple]);

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
            .from("image_metadata")
            .select("*")
            .eq("folder_id", folderId)
            .order("created_at", { ascending: false })
        : supabase
            .from("image_metadata")
            .select("*")
            .is("folder_id", null)
            .order("created_at", { ascending: false });

      // Se há busca, usar função de busca
      if (searchQuery.trim()) {
        const { data: searchData, error: searchError } = await supabase
          .rpc("search_images", {
            search_query: searchQuery.trim() || null,
            folder_id_filter: folderId,
            limit_count: 100,
            offset_count: 0
          });

        if (searchError) throw searchError;
        setImages((searchData || []).map((img: any) => ({
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
        
        // Buscar informações das pastas para as imagens
        const folderIdsSet = new Set((imagesResult.data || []).map((img: any) => img.folder_id).filter(Boolean));
        const folderIds = Array.from(folderIdsSet) as string[];
        let foldersMap: Record<string, ImageFolder> = {};
        
        if (folderIds.length > 0) {
          const { data: foldersData } = await supabase
            .from("image_folders")
            .select("*")
            .in("id", folderIds);
          
          if (foldersData) {
            foldersMap = foldersData.reduce((acc, folder) => {
              acc[folder.id] = folder;
              return acc;
            }, {} as Record<string, ImageFolder>);
          }
        }
        
        setImages((imagesResult.data || []).map((img: any) => {
          const folder = img.folder_id ? foldersMap[img.folder_id] : null;
          return {
            ...img,
            folder_name: folder?.name || null,
            folder_path: folder?.path || null,
            tags: [], // Tags removidas - sempre array vazio
            url: supabase.storage.from("portfolio-images").getPublicUrl(img.storage_path).data.publicUrl
          };
        }));
      }

      // Buscar pasta atual e construir breadcrumbs
      if (folderId) {
        const { data: folderData, error: folderError } = await supabase
          .from("image_folders")
          .select("*")
          .eq("id", folderId)
          .single();

        if (!folderError && folderData) {
          setCurrentFolder(folderData);
          
          // Construir breadcrumbs a partir do path
          if (folderData.path) {
            const pathParts = folderData.path.split('/');
            const breadcrumbsList: ImageFolder[] = [];
            
            // Buscar cada pasta no caminho
            let currentPath = '';
            for (const part of pathParts) {
              currentPath = currentPath ? `${currentPath}/${part}` : part;
              
              // Buscar pasta pelo path
              const { data: pathFolder } = await supabase
                .from("image_folders")
                .select("*")
                .eq("path", currentPath)
                .single();
              
              if (pathFolder) {
                breadcrumbsList.push(pathFolder);
              }
            }
            
            setBreadcrumbs(breadcrumbsList);
          } else {
            setBreadcrumbs([]);
          }
        }
      } else {
        setCurrentFolder(null);
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

  // Buscar todas as pastas para o seletor de mover
  const fetchAllFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const { data, error } = await supabase
        .from("image_folders")
        .select("*")
        .order("path");

      if (error) throw error;
      setAllFolders(data || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (movingImage || movingImages.length > 0) {
      fetchAllFolders();
    }
  }, [movingImage, movingImages]);

  // Debounce para busca
  useEffect(() => {
    if (!isOpen) return;
    
    const timeoutId = setTimeout(() => {
      fetchData(currentFolderId);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (image: ImageMetadata) => {
    if (multipleMode) {
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
    if (multipleMode && selectedImages.length > 0) {
      onSelect(selectedImages);
      setIsOpen(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      if (multipleMode) {
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

  const handleDeleteFolder = async (e: React.MouseEvent, folder: ImageFolder) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"?\n\nTodas as imagens dentro dela serão movidas para a raiz.`)) return;

    try {
      setIsLoading(true);
      
      // Buscar todas as imagens na pasta
      const { data: imagesInFolder, error: imagesError } = await supabase
        .from("image_metadata")
        .select("id, storage_path, mime_type")
        .eq("folder_id", folder.id);

      if (imagesError) throw imagesError;

      // Mover todas as imagens para a raiz
      if (imagesInFolder && imagesInFolder.length > 0) {
        const movePromises = imagesInFolder.map(async (img) => {
          const fileName = img.storage_path.split('/').pop() || img.storage_path;
          const newStoragePath = fileName;

          // Baixar arquivo
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("portfolio-images")
            .download(img.storage_path);

          if (downloadError) throw downloadError;

          // Upload no novo local (raiz)
          const { error: uploadError } = await supabase.storage
            .from("portfolio-images")
            .upload(newStoragePath, fileData, {
              contentType: img.mime_type || 'image/jpeg',
              upsert: false
            });

          if (uploadError && !uploadError.message.includes('already exists')) {
            throw uploadError;
          }

          // Remover arquivo antigo
          await supabase.storage
            .from("portfolio-images")
            .remove([img.storage_path]);

          // Atualizar metadados
          const { error: updateError } = await supabase
            .from("image_metadata")
            .update({
              storage_path: newStoragePath,
              folder_id: null
            })
            .eq("id", img.id);

          if (updateError) throw updateError;
        });

        await Promise.all(movePromises);
      }

      // Excluir a pasta
      const { error: deleteError } = await supabase
        .from("image_folders")
        .delete()
        .eq("id", folder.id);

      if (deleteError) throw deleteError;

      // Se estávamos dentro da pasta excluída, voltar para a raiz
      if (currentFolderId === folder.id) {
        setCurrentFolderId(null);
      }

      await fetchData(currentFolderId);
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      alert(`Erro ao excluir pasta: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

  const moveSingleImage = async (image: ImageMetadata, targetFolderId: string | null) => {
    // Buscar path da pasta de destino
    let newStoragePath = image.storage_path.split('/').pop() || image.storage_path;
    
    if (targetFolderId) {
      const { data: folderData } = await supabase
        .from("image_folders")
        .select("path")
        .eq("id", targetFolderId)
        .single();

      if (folderData?.path) {
        const fileName = image.storage_path.split('/').pop() || image.storage_path;
        newStoragePath = `${folderData.path}/${fileName}`;
      }
    }

    // Mover arquivo no storage (usando copy + remove)
    // 1. Baixar o arquivo
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("portfolio-images")
      .download(image.storage_path);

    if (downloadError) throw downloadError;

    // 2. Fazer upload no novo local
    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(newStoragePath, fileData, {
        contentType: image.mime_type || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      // Se já existe no destino, tentar remover primeiro
      if (uploadError.message.includes('already exists')) {
        await supabase.storage
          .from("portfolio-images")
          .remove([newStoragePath]);
        
        const { error: retryError } = await supabase.storage
          .from("portfolio-images")
          .upload(newStoragePath, fileData, {
            contentType: image.mime_type || 'image/jpeg',
            upsert: false
          });
        
        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    // 3. Remover arquivo antigo
    const { error: removeError } = await supabase.storage
      .from("portfolio-images")
      .remove([image.storage_path]);

    if (removeError) {
      console.warn("Arquivo movido mas não foi possível remover o original:", removeError);
    }

    // 4. Atualizar metadados
    const { error: updateError } = await supabase
      .from("image_metadata")
      .update({
        storage_path: newStoragePath,
        folder_id: targetFolderId
      })
      .eq("id", image.id);

    if (updateError) throw updateError;
  };

  const handleMoveImage = async (targetFolderId: string | null) => {
    if (!movingImage) return;

    try {
      setIsMoving(true);
      await moveSingleImage(movingImage, targetFolderId);
      setMovingImage(null);
      await fetchData(currentFolderId);
    } catch (error: any) {
      console.error("Error moving image:", error);
      alert(`Erro ao mover imagem: ${error.message}`);
    } finally {
      setIsMoving(false);
    }
  };

  const handleMoveMultipleImages = async (targetFolderId: string | null) => {
    if (movingImages.length === 0) return;

    try {
      setIsMoving(true);
      
      // Mover todas as imagens
      const movePromises = movingImages.map(img => moveSingleImage(img, targetFolderId));
      await Promise.all(movePromises);

      setMovingImages([]);
      await fetchData(currentFolderId);
    } catch (error: any) {
      console.error("Error moving images:", error);
      alert(`Erro ao mover imagens: ${error.message}`);
    } finally {
      setIsMoving(false);
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
      <DialogContent className="bg-background border-white/10 max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Galeria de Imagens</DialogTitle>
          <VisuallyHidden>
            <h2>Selecione uma imagem da galeria</h2>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Barra de busca e ações */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar imagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-white/10"
              />
            </div>
            
            {/* Toggle modo múltiplo */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <Switch
                checked={multipleMode}
                onCheckedChange={(checked) => {
                  setMultipleMode(checked);
                  if (!checked) {
                    setSelectedImages([]);
                  }
                }}
                id="multiple-mode"
              />
              <label htmlFor="multiple-mode" className="text-sm text-gray-300 cursor-pointer">
                Seleção Múltipla
              </label>
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
            {multipleMode && selectedImages.length > 0 && (
              <>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    const selectedImageObjects = images.filter(img => selectedImages.includes(img.url));
                    setMovingImages(selectedImageObjects);
                  }}
                  size="sm"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Mover ({selectedImages.length})
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    if (!confirm(`Tem certeza que deseja excluir ${selectedImages.length} imagem(ns)?`)) return;
                    
                    const selectedImageObjects = images.filter(img => selectedImages.includes(img.url));
                    setIsLoading(true);
                    try {
                      const deletePromises = selectedImageObjects.map(async (img) => {
                        // Remover do storage
                        const { error: storageError } = await supabase.storage
                          .from("portfolio-images")
                          .remove([img.storage_path]);

                        if (storageError) throw storageError;

                        // Remover metadados
                        const { error: metadataError } = await supabase
                          .from("image_metadata")
                          .delete()
                          .eq("id", img.id);

                        if (metadataError) throw metadataError;
                      });

                      await Promise.all(deletePromises);
                      setSelectedImages([]);
                      await fetchData(currentFolderId);
                    } catch (error: any) {
                      console.error("Error deleting images:", error);
                      alert(`Erro ao excluir imagens: ${error.message}`);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedImages.length})
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmSelection}
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar ({selectedImages.length})
                </Button>
              </>
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
          {currentFolder && currentFolder.path && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pastas */}
                {!searchQuery && folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-white/20 transition-all group bg-white/5 flex flex-col items-center justify-center"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <Folder className="w-12 h-12 text-neon-purple mb-2" />
                    <span className="text-sm text-center px-2 truncate w-full">{folder.name}</span>
                    <button
                      className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      onClick={(e) => handleDeleteFolder(e, folder)}
                      title="Excluir pasta (imagens serão movidas para a raiz)"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}

                {/* Imagens */}
                {images.map((img) => {
                  const isSelected = multipleMode
                    ? selectedImages.includes(img.url)
                    : selectedImage === img.url;

                  return (
                    <div
                      key={img.id}
                      className={cn(
                        "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all group bg-white/5",
                        isSelected ? "border-neon-purple" : "border-transparent hover:border-white/20"
                      )}
                      onClick={() => handleSelect(img)}
                    >
                      {/* Imagem */}
                      <div className="aspect-square relative">
                        <img 
                          src={img.url} 
                          alt={img.display_name || img.storage_path} 
                          className="w-full h-full object-cover" 
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-neon-purple/30 flex items-center justify-center">
                            <div className="bg-neon-purple rounded-full p-2 shadow-lg">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="p-1.5 bg-blue-500/90 rounded hover:bg-blue-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(img);
                              }}
                              title="Ver detalhes"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              className="p-1.5 bg-blue-500/90 rounded hover:bg-blue-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImage(img);
                              }}
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              className="p-1.5 bg-purple-500/90 rounded hover:bg-purple-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingImage(img);
                              }}
                              title="Mover"
                            >
                              <Move className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              className="p-1.5 bg-red-500/90 rounded hover:bg-red-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => handleDelete(e, img)}
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                        {img.tags && img.tags.length > 0 && (
                          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                            {img.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-black/80 text-white px-2 py-1 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Informações */}
                      <div className="p-4 space-y-2 bg-white/5">
                        <div className="text-base font-semibold text-white truncate">
                          {img.display_name || img.storage_path.split('/').pop()}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          {img.width && img.height && (
                            <span className="flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {img.width} × {img.height} px
                            </span>
                          )}
                          {img.file_size && (
                            <span className="font-medium">{formatFileSize(img.file_size)}</span>
                          )}
                        </div>
                        {img.folder_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Folder className="w-4 h-4" />
                            <span className="truncate">{img.folder_name}</span>
                          </div>
                        )}
                        {img.description && (
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {img.description}
                          </div>
                        )}
                      </div>
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

        {/* Dialog de visualização detalhada */}
        {viewingImage && (
          <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
            <DialogContent className="bg-background border-white/10 max-w-6xl max-h-[95vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-white text-xl">
                  {viewingImage.display_name || viewingImage.storage_path.split('/').pop()}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid md:grid-cols-2 gap-6 py-4">
                  {/* Preview da imagem */}
                  <div className="space-y-4 flex flex-col">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20 flex-shrink-0">
                      <img 
                        src={viewingImage.url} 
                        alt={viewingImage.display_name || viewingImage.storage_path}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Ações rápidas */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 justify-start"
                        onClick={() => {
                          setViewingImage(null);
                          setEditingImage(viewingImage);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-white/10 justify-start"
                        onClick={() => {
                          setViewingImage(null);
                          setMovingImage(viewingImage);
                        }}
                      >
                        <Move className="w-4 h-4 mr-2" />
                        Mover
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 justify-start"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta imagem?")) {
                            handleDelete({ stopPropagation: () => {} } as any, viewingImage);
                            setViewingImage(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="space-y-4 flex flex-col min-h-0">
                    <div className="space-y-3 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Informações
                      </h3>
                    </div>
                    
                    <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-white/10">
                        <span className="text-gray-400 flex-shrink-0">Nome de Exibição:</span>
                        <span className="text-white font-medium break-words text-right">
                          {viewingImage.display_name || "Não definido"}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-2 border-b border-white/10">
                        <span className="text-gray-400 flex-shrink-0">Caminho:</span>
                        <span className="text-white break-all text-right text-xs">
                          {viewingImage.storage_path}
                        </span>
                      </div>
                      
                      {viewingImage.folder_name && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-white/10">
                          <span className="text-gray-400 flex-shrink-0">Pasta:</span>
                          <span className="text-white flex items-center gap-1 justify-end">
                            <Folder className="w-4 h-4" />
                            {viewingImage.folder_name}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-white/10">
                        <span className="text-gray-400 flex-shrink-0">Dimensões:</span>
                        <span className="text-white text-right">
                          {viewingImage.width && viewingImage.height 
                            ? `${viewingImage.width} × ${viewingImage.height} px`
                            : "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-white/10">
                        <span className="text-gray-400 flex-shrink-0">Tamanho do Arquivo:</span>
                        <span className="text-white text-right">
                          {formatFileSize(viewingImage.file_size)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-white/10">
                        <span className="text-gray-400 flex-shrink-0">Tipo MIME:</span>
                        <span className="text-white text-right">
                          {viewingImage.mime_type || "N/A"}
                        </span>
                      </div>
                      
                      {viewingImage.description && (
                        <div className="py-2 border-b border-white/10">
                          <span className="text-gray-400 block mb-1">Descrição:</span>
                          <span className="text-white break-words">{viewingImage.description}</span>
                        </div>
                      )}
                      
                      {viewingImage.alt_text && (
                        <div className="py-2 border-b border-white/10">
                          <span className="text-gray-400 block mb-1">Texto Alternativo:</span>
                          <span className="text-white break-words">{viewingImage.alt_text}</span>
                        </div>
                      )}
                      
                      {viewingImage.tags && viewingImage.tags.length > 0 && (
                        <div className="py-2">
                          <span className="text-gray-400 block mb-2">Tags:</span>
                          <div className="flex flex-wrap gap-2">
                            {viewingImage.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 text-xs text-gray-500">
                        <span>Data de Criação:</span>
                        <span className="text-right">
                          {viewingImage.created_at 
                            ? new Date(viewingImage.created_at).toLocaleString('pt-BR')
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

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

        {/* Dialog de mover imagem única */}
        {movingImage && (
          <Dialog open={!!movingImage} onOpenChange={() => setMovingImage(null)}>
            <DialogContent className="bg-background border-white/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mover Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Movendo: <span className="text-white font-medium">{movingImage.display_name || movingImage.storage_path.split('/').pop()}</span>
                </div>
                
                {isLoadingFolders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    <button
                      onClick={() => handleMoveImage(null)}
                      disabled={isMoving}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        movingImage.folder_id === null
                          ? "border-neon-purple bg-neon-purple/10"
                          : "border-white/10 hover:border-white/20 bg-white/5",
                        isMoving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-neon-purple" />
                        <span className="font-medium">Raiz (pasta principal)</span>
                      </div>
                    </button>
                    
                    {allFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleMoveImage(folder.id)}
                        disabled={isMoving}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-2 transition-all",
                          movingImage.folder_id === folder.id
                            ? "border-neon-purple bg-neon-purple/10"
                            : "border-white/10 hover:border-white/20 bg-white/5",
                          isMoving && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-neon-purple" />
                          <div className="flex-1">
                            <div className="font-medium">{folder.name}</div>
                            <div className="text-xs text-gray-400 truncate">{folder.path}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {allFolders.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        Nenhuma pasta disponível. Crie uma pasta primeiro.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                  <Button variant="outline" onClick={() => setMovingImage(null)} disabled={isMoving}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de mover múltiplas imagens */}
        {movingImages.length > 0 && (
          <Dialog open={movingImages.length > 0} onOpenChange={() => setMovingImages([])}>
            <DialogContent className="bg-background border-white/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mover {movingImages.length} Imagem(ns)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-gray-400">
                  Movendo <span className="text-white font-medium">{movingImages.length}</span> imagem(ns) selecionada(s)
                </div>
                
                {isLoadingFolders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    <button
                      onClick={() => handleMoveMultipleImages(null)}
                      disabled={isMoving}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        "border-white/10 hover:border-white/20 bg-white/5",
                        isMoving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-neon-purple" />
                        <span className="font-medium">Raiz (pasta principal)</span>
                      </div>
                    </button>
                    
                    {allFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleMoveMultipleImages(folder.id)}
                        disabled={isMoving}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-2 transition-all",
                          "border-white/10 hover:border-white/20 bg-white/5",
                          isMoving && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-neon-purple" />
                          <div className="flex-1">
                            <div className="font-medium">{folder.name}</div>
                            <div className="text-xs text-gray-400 truncate">{folder.path}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {allFolders.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        Nenhuma pasta disponível. Crie uma pasta primeiro.
                      </div>
                    )}
                  </div>
                )}
                
                {isMoving && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Movendo imagens...</span>
                  </div>
                )}
                
                <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                  <Button variant="outline" onClick={() => setMovingImages([])} disabled={isMoving}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
