import {
  SidebarRepository,
  SidebarContactInfo,
} from "../interfaces/SidebarRepository";

export class StaticSidebarRepository implements SidebarRepository {
  async getContactInfo(): Promise<SidebarContactInfo | null> {
    try {
      const response = await fetch("/data/sidebar.json");
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error loading static sidebar data:", error);
      return null;
    }
  }
}
