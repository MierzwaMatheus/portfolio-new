import { TranslationService } from "../interfaces/TranslationService";

/**
 * Stub translation service used while no Convex translate action exists.
 * Returns the source text unchanged. Replace with a ConvexTranslationService
 * once `convex/translate.ts` is added to the backend.
 */
export class NoopTranslationService implements TranslationService {
  async translate(text: string): Promise<string> {
    return text;
  }

  async translateBatch(texts: string[]): Promise<string[]> {
    return texts;
  }
}
