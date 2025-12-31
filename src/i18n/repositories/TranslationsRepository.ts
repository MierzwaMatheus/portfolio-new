export interface TranslationsRepository {
  getStaticTranslation(key: string, locale: string): string | undefined;
  getAllStaticTranslations(locale: string): Record<string, string>;
}


