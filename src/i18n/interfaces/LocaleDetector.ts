export interface LocaleDetector {
  detect(): Promise<string>;
  detectSync(): string;
}


