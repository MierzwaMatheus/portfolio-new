import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { ResumeRepository, ResumeItem } from "@/repositories/interfaces/ResumeRepository";

export function useResume(repository: ResumeRepository) {
  const { locale } = useI18n();

  const { data: itemsRaw, isLoading } = useQuery({
    queryKey: ['resume', 'items'],
    queryFn: () => repository.list(),
  });

  // Processa items com tradução
  const items = useMemo(() => {
    if (!itemsRaw) return [];
    
    return itemsRaw.map(item => {
      // Helper function to get translated content based on locale
      let translatedContent = item.content;
      if (item.content_translations) {
        // Tenta usar a tradução para o locale atual, depois pt-BR como fallback, depois content original
        translatedContent = item.content_translations[locale as 'pt-BR' | 'en-US'] 
          || item.content_translations['pt-BR'] 
          || item.content;
      }
      
      return {
        ...item,
        translatedContent,
      };
    });
  }, [itemsRaw, locale]);

  const getItemsByType = (type: string) => 
    items.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);

  return {
    items,
    getItemsByType,
    isLoading,
  };
}

