export interface TranslationService {
  translate(text: string, targetLocale: string, sourceLocale?: string): Promise<string>;
  translateBatch(texts: string[], targetLocale: string, sourceLocale?: string): Promise<string[]>;
}


