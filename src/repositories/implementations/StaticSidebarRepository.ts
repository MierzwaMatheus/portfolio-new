import {
  SidebarRepository,
  SidebarContactInfo,
} from "../interfaces/SidebarRepository";
import { mapSidebarContactInfo } from "../mappers/convexMappers";

export class StaticSidebarRepository implements SidebarRepository {
  async getContactInfo(): Promise<SidebarContactInfo | null> {
    try {
      const response = await fetch("/data/sidebar.json");
      if (!response.ok) return null;
      const raw = await response.json();
      return mapSidebarContactInfo(raw);
    } catch (error) {
      console.error("Error loading static sidebar data:", error);
      return null;
    }
  }
}
