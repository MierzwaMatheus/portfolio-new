export interface CaseStudyMetric {
  label: string;
  value: string;
  icon?: string;
}

export interface CaseStudyTestimonial {
  text: string;
  author: string;
  role?: string;
}

export interface CaseStudy {
  problem: string;
  solution: string;
  results: string;
  metrics: CaseStudyMetric[];
  testimonial?: CaseStudyTestimonial;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  long_description: string;
  tags: string[];
  images: string[];
  demo_link: string;
  github_link: string;
  slug?: string;
  case_study?: CaseStudy;
  case_study_translations?: Record<string, { problem?: string; solution?: string; results?: string }>;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  long_description_translations?: Record<string, string>;
  order_index?: number;
}

export interface PortfolioRepository {
  list(): Promise<Project[]>;
  getBySlug(slug: string): Promise<Project | null>;
}
