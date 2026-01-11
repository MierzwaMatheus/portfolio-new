import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { AboutRepository } from "@/repositories/interfaces/AboutRepository";

export function useAbout(repository: AboutRepository) {
  const { locale } = useI18n();

  const { data: dailyRoutineRaw, isLoading: isLoadingDailyRoutine } = useQuery({
    queryKey: ['about', 'daily-routine'],
    queryFn: () => repository.getDailyRoutineItems(),
  });

  const { data: faqRaw, isLoading: isLoadingFAQ } = useQuery({
    queryKey: ['about', 'faq'],
    queryFn: () => repository.getFAQItems(),
  });

  const isLoading = isLoadingDailyRoutine || isLoadingFAQ;

  // Deriva daily routine traduzido baseado no locale atual (sem refetch)
  const dailyRoutine = useMemo(() => {
    if (!dailyRoutineRaw) return [];
    
    return dailyRoutineRaw.map((item) => ({
      ...item,
      description: item.description_translations?.[locale] || item.description_translations?.['pt-BR'] || item.description || '',
    }));
  }, [dailyRoutineRaw, locale]);

  // Deriva FAQ traduzido baseado no locale atual (sem refetch)
  const faq = useMemo(() => {
    if (!faqRaw) return [];
    
    return faqRaw.map((item) => ({
      ...item,
      question: item.question_translations?.[locale] || item.question_translations?.['pt-BR'] || item.question || '',
      answer: item.answer_translations?.[locale] || item.answer_translations?.['pt-BR'] || item.answer || '',
    }));
  }, [faqRaw, locale]);

  return {
    dailyRoutine,
    faq,
    isLoading,
  };
}

