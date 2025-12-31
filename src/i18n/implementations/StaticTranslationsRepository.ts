import { TranslationsRepository } from '../repositories/TranslationsRepository';
import { ptBR } from '../translations/pt-BR';
import { enUS } from '../translations/en-US';

export class StaticTranslationsRepository implements TranslationsRepository {
  private translations = {
    'pt-BR': ptBR,
    'en-US': enUS,
  };
  
  getStaticTranslation(key: string, locale: string): string | undefined {
    const keys = key.split('.');
    let value: any = this.translations[locale as keyof typeof this.translations];
    
    if (!value) {
      // Fallback para pt-BR se não encontrar tradução
      value = this.translations['pt-BR'];
    }
    
    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        return undefined;
      }
      value = value[k];
    }
    
    return typeof value === 'string' ? value : undefined;
  }
  
  getAllStaticTranslations(locale: string): Record<string, string> {
    return this.translations[locale as keyof typeof this.translations] || this.translations['pt-BR'];
  }
}

