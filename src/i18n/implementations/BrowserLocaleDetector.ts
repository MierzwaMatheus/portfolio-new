import { LocaleDetector } from '../interfaces/LocaleDetector';

export class BrowserLocaleDetector implements LocaleDetector {
  private readonly BRAZIL_COUNTRY_CODE = 'BR';
  
  async detect(): Promise<string> {
    try {
      // Tenta detectar via API de geolocalização
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code === this.BRAZIL_COUNTRY_CODE) {
        return 'pt-BR';
      }
      return 'en-US';
    } catch {
      return this.detectSync();
    }
  }
  
  detectSync(): string {
    const browserLang = navigator.language || 'en-US';
    if (browserLang.startsWith('pt')) {
      return 'pt-BR';
    }
    return 'en-US';
  }
}

