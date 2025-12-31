import { useI18n } from '../context/I18nContext';

export function useTranslation() {
  const { t, tValue, locale } = useI18n();
  return { t, tValue, locale };
}


