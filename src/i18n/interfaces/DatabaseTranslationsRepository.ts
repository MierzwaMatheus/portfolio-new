export interface DatabaseTranslationsRepository {
  getContent(key: string, locale: string): Promise<string | null>;
  getServices(locale: string): Promise<any[]>;
  getTestimonials(locale: string): Promise<any[]>;
  getProjects(locale: string): Promise<any[]>;
}

