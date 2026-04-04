import { supabase } from "@/lib/supabase";
import {
  SidebarRepository,
  SidebarContactInfo,
} from "../interfaces/SidebarRepository";

export class SupabaseSidebarRepository implements SidebarRepository {
  async getContactInfo(): Promise<SidebarContactInfo | null> {
    const { data, error } = await supabase
      .schema("app_portfolio")
      .from("contact_info")
      .select(
        "name, role, role_translations, email, show_email, phone, show_phone, avatar_url, linkedin_url, github_url, behance_url"
      )
      .single();

    if (error) {
      console.error("Error fetching contact info:", error);
      return null;
    }

    return data as SidebarContactInfo;
  }
}
