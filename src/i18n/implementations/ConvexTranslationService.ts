import { ConvexReactClient } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { TranslationService } from '../interfaces/TranslationService';

export class ConvexTranslationService implements TranslationService {
  constructor(private convex: ConvexReactClient) {}

  async translate(text: string, targetLocale: string, sourceLocale = 'pt-BR'): Promise<string> {
    const result = await this.convex.action(api.translation.translateBatch, {
      texts: [text],
      source: sourceLocale,
      target: targetLocale,
    });
    return result.translatedTexts[0] ?? text;
  }

  async translateBatch(texts: string[], targetLocale: string, sourceLocale = 'pt-BR'): Promise<string[]> {
    const result = await this.convex.action(api.translation.translateBatch, {
      texts,
      source: sourceLocale,
      target: targetLocale,
    });
    return result.translatedTexts;
  }
}
