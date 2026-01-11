import { supabase } from "@/lib/supabase";
import {
  HomeRepository,
  ContactInfo,
  AboutData,
  Service,
  Testimonial,
} from "../interfaces/HomeRepository";

export class SupabaseHomeRepository implements HomeRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('contact_info')
      .select('role, role_translations')
      .single();

    if (error) {
      console.error("Error fetching contact info:", error);
      return null;
    }

    return data as ContactInfo;
  }

  async getAboutData(): Promise<AboutData | null> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('content')
      .select('value')
      .eq('key', 'about_text')
      .single();

    if (error) {
      console.error("Error fetching about:", error);
      return null;
    }

    return data as AboutData;
  }

  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('services')
      .select('id, title, description, title_translations, description_translations')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }

    return (data || []) as Service[];
  }

  async getTestimonials(): Promise<Testimonial[]> {
    const { data, error } = await supabase
      .schema('app_portfolio')
      .from('testimonials')
      .select('id, name, role, text, image_url, role_translations, text_translations')
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }

    return (data || []) as Testimonial[];
  }
}

