export interface Project {
  id: number;
  title: string;
  description: string;
  long_description: string;
  tags: string[];
  images: string[];
  demo_link: string;
  github_link: string;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  long_description_translations?: Record<string, string>;
  order_index?: number;
}

export interface PortfolioRepository {
  list(): Promise<Project[]>;
}

