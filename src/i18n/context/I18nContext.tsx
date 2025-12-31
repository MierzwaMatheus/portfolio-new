import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { LocaleDetector } from '../interfaces/LocaleDetector';
import { TranslationsRepository } from '../repositories/TranslationsRepository';
import { DatabaseTranslationsRepository } from '../interfaces/DatabaseTranslationsRepository';
import { TranslationService } from '../interfaces/TranslationService';
import { StaticTranslationsRepository } from '../implementations/StaticTranslationsRepository';
import { BrowserLocaleDetector } from '../implementations/BrowserLocaleDetector';
import { SupabaseTranslationService } from '../implementations/SupabaseTranslationService';
import { CachedTranslationService } from '../implementations/CachedTranslationService';
import { AutoTranslatingRepository } from '../implementations/AutoTranslatingRepository';

type Locale = 'pt-BR' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dbRepository: DatabaseTranslationsRepository;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  localeDetector?: LocaleDetector;
  translationsRepository?: TranslationsRepository;
  translationService?: TranslationService;
}

export function I18nProvider({ 
  children, 
  localeDetector = new BrowserLocaleDetector(),
  translationsRepository = new StaticTranslationsRepository(),
  translationService,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en-US');
  const [isLoading, setIsLoading] = useState(true);

  // Cria o serviço de tradução com cache
  const cachedTranslationService = useMemo(() => {
    const service = translationService || new SupabaseTranslationService();
    return new CachedTranslationService(service);
  }, [translationService]);

  // Cria o repositório que traduz automaticamente
  const dbRepository = useMemo(() => {
    return new AutoTranslatingRepository(cachedTranslationService);
  }, [cachedTranslationService]);

  useEffect(() => {
    const detectLocale = async () => {
      try {
        // Verifica se há locale salvo
        const savedLocale = localStorage.getItem('locale') as Locale | null;
        if (savedLocale && (savedLocale === 'pt-BR' || savedLocale === 'en-US')) {
          setLocaleState(savedLocale);
          setIsLoading(false);
          return;
        }

        // Detecta automaticamente
        const detected = await localeDetector.detect();
        setLocaleState(detected as Locale);
      } catch (error) {
        console.error('Error detecting locale:', error);
        setLocaleState(localeDetector.detectSync() as Locale);
      } finally {
        setIsLoading(false);
      }
    };
    
    detectLocale();
  }, [localeDetector]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const translation = translationsRepository.getStaticTranslation(key, locale);
    return translation || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dbRepository, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

