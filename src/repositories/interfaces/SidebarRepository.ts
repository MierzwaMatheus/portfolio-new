export interface SidebarContactInfo {
  name: string;
  role: string;
  role_translations?: Record<string, string>;
  email: string;
  show_email: boolean;
  phone: string;
  show_phone: boolean;
  avatar_url: string;
  linkedin_url: string;
  github_url: string;
  behance_url: string;
}

export interface SidebarRepository {
  getContactInfo(): Promise<SidebarContactInfo | null>;
}
