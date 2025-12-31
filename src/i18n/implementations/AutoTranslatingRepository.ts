import { DatabaseTranslationsRepository } from '../interfaces/DatabaseTranslationsRepository';
import { TranslationService } from '../interfaces/TranslationService';
import { supabase } from '@/lib/supabase';

export class AutoTranslatingRepository implements DatabaseTranslationsRepository {
  constructor(
    private translationService: TranslationService,
    private sourceLocale: string = 'pt-BR'
  ) {}
  
  async getContent(key: string, locale: string): Promise<string | null> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('content')
      .select('value')
      .eq('key', key)
      .single();
      
    if (error || !data || !data.value) return null;
    
    // Se for pt-BR, retorna direto
    if (locale === this.sourceLocale) {
      return data.value;
    }
    
    // Traduz automaticamente
    return this.translationService.translate(data.value, locale, this.sourceLocale);
  }
  
  async getServices(locale: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('services')
      .select('id, title, description, created_at')
      .order('created_at');
      
    if (error || !data) return [];
    
    // Se for pt-BR, retorna direto
    if (locale === this.sourceLocale) {
      return data;
    }
    
    // Traduz automaticamente
    const titles = data.map(s => s.title || '');
    const descriptions = data.map(s => s.description || '');
    
    const [translatedTitles, translatedDescriptions] = await Promise.all([
      this.translationService.translateBatch(titles, locale),
      this.translationService.translateBatch(descriptions, locale),
    ]);
    
    return data.map((service, index) => ({
      ...service,
      title: translatedTitles[index] || service.title,
      description: translatedDescriptions[index] || service.description,
    }));
  }
  
  async getTestimonials(locale: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('testimonials')
      .select('id, name, role, text, image_url, created_at')
      .order('created_at');
      
    if (error || !data) return [];
    
    // Se for pt-BR, retorna direto
    if (locale === this.sourceLocale) {
      return data;
    }
    
    // Traduz apenas o campo 'text' (name e role geralmente não precisam traduzir)
    const texts = data.map(t => t.text || '');
    const translatedTexts = await this.translationService.translateBatch(texts, locale);
    
    return data.map((testimonial, index) => ({
      ...testimonial,
      text: translatedTexts[index] || testimonial.text,
    }));
  }
  
  async getProjects(locale: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('projects')
      .select('id, title, description, long_description, tags, images, demo_link, github_link, order_index')
      .order('order_index', { ascending: true, nullsFirst: false });
      
    if (error || !data) return [];
    
    // Se for pt-BR, retorna direto
    if (locale === this.sourceLocale) {
      return data;
    }
    
    // Traduz campos de texto
    const titles = data.map(p => p.title || '');
    const descriptions = data.map(p => p.description || '');
    const longDescriptions = data.map(p => p.long_description || '');
    
    const [translatedTitles, translatedDescriptions, translatedLongDescriptions] = await Promise.all([
      this.translationService.translateBatch(titles, locale),
      this.translationService.translateBatch(descriptions, locale),
      this.translationService.translateBatch(longDescriptions, locale),
    ]);
    
    return data.map((project, index) => ({
      ...project,
      title: translatedTitles[index] || project.title,
      description: translatedDescriptions[index] || project.description,
      long_description: translatedLongDescriptions[index] || project.long_description,
    }));
  }
}

