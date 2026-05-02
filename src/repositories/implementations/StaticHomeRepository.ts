import {
  HomeRepository,
  ContactInfo,
  AboutData,
  Service,
  Testimonial,
  AvailabilityData,
} from "../interfaces/HomeRepository";
import {
  mapContactInfo,
  mapService,
  mapTestimonial,
  mapTranslations,
} from "../mappers/convexMappers";

export class StaticHomeRepository implements HomeRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    try {
      const response = await fetch("/data/sidebar.json");
      if (!response.ok) return null;
      const raw = await response.json();
      return mapContactInfo(raw);
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
      const aboutText =
        data?.about_text ?? data?.aboutText ?? data?.["about-text"] ?? {};
      return { value: mapTranslations(aboutText) ?? {} };
    } catch (error) {
      console.error("Error loading static home data:", error);
      return null;
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      const response = await fetch("/data/about.json");
      if (!response.ok) return [];
      const data = await response.json();
      const list = Array.isArray(data?.services) ? data.services : [];
      return list.map(mapService);
    } catch (error) {
      console.error("Error loading static about data:", error);
      return [];
    }
  }

  async getTestimonials(): Promise<Testimonial[]> {
    try {
      const response = await fetch("/data/about.json");
      if (!response.ok) return [];
      const data = await response.json();
      const list = Array.isArray(data?.testimonials) ? data.testimonials : [];
      return list.map(mapTestimonial);
    } catch (error) {
      console.error("Error loading static about data:", error);
      return [];
    }
  }

  async getAvailability(): Promise<AvailabilityData | null> {
    try {
      const response = await fetch("/data/home.json");
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.availability_status) return null;
      return {
        available: Boolean(data.availability_status.available),
        label: data.availability_status.label ?? {},
      };
    } catch {
      return null;
    }
  }
}
