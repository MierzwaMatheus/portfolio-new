import {
  HomeRepository,
  ContactInfo,
  AboutData,
  Service,
  Testimonial,
} from "../interfaces/HomeRepository";

export class StaticHomeRepository implements HomeRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    try {
      const response = await fetch("/data/sidebar.json");
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error loading static sidebar data:", error);
      return null;
    }
  }

  async getAboutData(): Promise<AboutData | null> {
    try {
      const response = await fetch("/data/home.json");
      if (!response.ok) return null;
      const data = await response.json();
      return { value: data.about_text || {} };
    } catch (error) {
      console.error("Error loading static home data:", error);
      return null;
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch("/data/home.json");
      if (!response.ok) return [];
      const data = await response.json();
      return data.services || [];
    } catch (error) {
      console.error("Error loading static home data:", error);
      return [];
    }
  }

  async getTestimonials(): Promise<Testimonial[]> {
    try {
      const response = await fetch("/data/home.json");
      if (!response.ok) return [];
      const data = await response.json();
      return data.testimonials || [];
    } catch (error) {
      console.error("Error loading static home data:", error);
      return [];
    }
  }
}
