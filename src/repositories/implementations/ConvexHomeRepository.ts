import { ConvexHttpClient } from "convex/browser";
import {
  HomeRepository,
  ContactInfo,
  AboutData,
  Service,
  Testimonial,
} from "../interfaces/HomeRepository";
import {
  mapContactInfo,
  mapService,
  mapTestimonial,
  mapTranslations,
} from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexHomeRepository implements HomeRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    const data = await client.query(api.contactInfo.get, {});
    return data ? mapContactInfo(data) : null;
  }

  async getAboutData(): Promise<AboutData | null> {
    const data = await client.query(api.homeContent.getByKey, {
      key: "about_text",
    });
    if (!data) return { value: {} };
    const value = (data as any).value ?? {};
    return { value: mapTranslations(value) ?? {} };
  }

  async getServices(): Promise<Service[]> {
    const data = await client.query(api.services.list, {});
    return Array.isArray(data) ? data.map(mapService) : [];
  }

  async getTestimonials(): Promise<Testimonial[]> {
    const data = await client.query(api.testimonials.list, {});
    return Array.isArray(data) ? data.map(mapTestimonial) : [];
  }
}
