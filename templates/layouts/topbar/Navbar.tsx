import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Briefcase, FolderOpen, User, PenTool } from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { usePlugins } from "@/contexts/PluginsContext";
import { useSidebar } from "@/hooks/useSidebar";
import { sidebarRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";

const NAV_ITEMS_KEYS: Array<{ key: string; href: string; icon: React.ElementType; pluginId?: PluginId }> = [
  { key: "home", href: "/", icon: Home },
  { key: "resume", href: "/curriculo", icon: Briefcase, pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", icon: FolderOpen, pluginId: "portfolio" },
  { key: "about", href: "/sobre", icon: User, pluginId: "about" },
  { key: "blog", href: "/blog", icon: PenTool, pluginId: "blog" },
];

export function Navbar() {
  const { t } = useTranslation();
  const { isEnabled } = usePlugins();
  const [location] = useLocation();
  const { contactInfo } = useSidebar(sidebarRepository);

  const NAV_ITEMS = NAV_ITEMS_KEYS
    .filter(item => !item.pluginId || isEnabled(item.pluginId))
    .map(item => ({ ...item, label: t(`navigation.${item.key}`) }));

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-md border-b border-white/10 z-50 flex items-center px-4 md:px-8">
      {/* Logo / site name */}
      <div className="flex items-center mr-8">
        <Link href="/">
          <a className="font-bold text-white text-sm hover:text-neon-purple transition-colors">
            {contactInfo?.name || "Portfolio"}
          </a>
        </Link>
      </div>

      {/* Desktop nav links */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(item => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-white/5 border border-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-2 h-4 w-4",
                    isActive ? "text-neon-purple" : "text-gray-500"
                  )}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
