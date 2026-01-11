export interface ContactInfo {
  role: string;
  role_translations?: Record<string, string>;
}

export interface AboutData {
  value: Record<string, string>;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image_url: string;
  role_translations?: Record<string, string>;
  text_translations?: Record<string, string>;
}

export interface HomeRepository {
  getContactInfo(): Promise<ContactInfo | null>;
  getAboutData(): Promise<AboutData | null>;
  getServices(): Promise<Service[]>;
  getTestimonials(): Promise<Testimonial[]>;
}

