export interface DailyRoutineItem {
  id: string;
  image_url: string;
  tags: string[];
  description: string;
  description_translations?: Record<string, string>;
  span_size: '1x1' | '1x2' | '2x1' | '2x2';
  display_order: number;
}

export interface FAQItem {
  id: string;
  question: string;
  question_translations?: Record<string, string>;
  answer: string;
  answer_translations?: Record<string, string>;
  display_order: number;
}

export interface AboutRepository {
  getDailyRoutineItems(): Promise<DailyRoutineItem[]>;
  getFAQItems(): Promise<FAQItem[]>;
}

