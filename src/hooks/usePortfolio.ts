import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { PortfolioRepository, Project } from "@/repositories/interfaces/PortfolioRepository";

export function usePortfolio(repository: PortfolioRepository) {
  const { locale } = useI18n();

  const { data: projectsRaw, isLoading, error } = useQuery({
    queryKey: ['portfolio', 'projects'],
    queryFn: () => repository.list(),
  });

  // Deriva projetos traduzidos baseados no locale atual (sem refetch)
  const projects = useMemo(() => {
    if (!projectsRaw) return [];
    
    return projectsRaw.map((project) => ({
      ...project,
      title: project.title_translations?.[locale] || project.title_translations?.['pt-BR'] || project.title || '',
      description: project.description_translations?.[locale] || project.description_translations?.['pt-BR'] || project.description || '',
      long_description: project.long_description_translations?.[locale] || project.long_description_translations?.['pt-BR'] || project.long_description || '',
    }));
  }, [projectsRaw, locale]);

  return {
    projects,
    isLoading,
    error,
  };
}

