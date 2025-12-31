import { TranslationService } from '../interfaces/TranslationService';
import { supabase } from '@/lib/supabase';

export class SupabaseTranslationService implements TranslationService {
  private getLocaleCode(locale: string): string {
    return locale.split('-')[0]; // 'pt-BR' -> 'pt', 'en-US' -> 'en'
  }

  async translate(text: string, targetLocale: string, sourceLocale = 'pt-BR'): Promise<string> {
    if (sourceLocale === targetLocale || !text) return text;
    
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          q: text,
          source: this.getLocaleCode(sourceLocale),
          target: this.getLocaleCode(targetLocale),
          format: 'text',
        },
      });

      if (error) {
        console.error('Translation error:', error);
        return text; // Fallback para texto original
      }

      // A API retorna { translatedText: "..." } ou { text: "..." }
      return data?.translatedText || data?.text || data?.data?.translatedText || text;
    } catch (error) {
      console.error('Translation service error:', error);
      return text; // Fallback para texto original
    }
  }
  
  async translateBatch(texts: string[], targetLocale: string, sourceLocale = 'pt-BR'): Promise<string[]> {
    if (sourceLocale === targetLocale || texts.length === 0) return texts;
    
    // Traduz em paralelo
    const translations = await Promise.all(
      texts.map(text => this.translate(text, targetLocale, sourceLocale))
    );
    
    return translations;
  }
}

