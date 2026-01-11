export interface ResumeItem {
  id: string;
  type: string;
  content: any;
  content_translations?: Record<string, any>;
  order_index: number;
}

export interface ResumeRepository {
  list(): Promise<ResumeItem[]>;
}

