import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Briefcase, FolderOpen, User, PenTool } from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { usePlugins } from "@/contexts/PluginsContext";
import type { PluginId } from "../../convex/pluginRegistry";

const NAV_ITEMS_KEYS: Array<{ key: string; href: string; icon: React.ElementType; pluginId?: PluginId }> = [
  { key: "home", href: "/", icon: Home },
  { key: "resume", href: "/curriculo", icon: Briefcase, pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", icon: FolderOpen, pluginId: "portfolio" },
  { key: "about", href: "/sobre", icon: User, pluginId: "about" },
  { key: "blog", href: "/blog", icon: PenTool, pluginId: "blog" },
];

export function Footer() {
  const { t } = useTranslation();
  const { isEnabled } = usePlugins();
  const [location] = useLocation();

  const NAV_ITEMS = NAV_ITEMS_KEYS
    .filter(item => !item.pluginId || isEnabled(item.pluginId))
    .map(item => ({ ...item, label: t(`navigation.${item.key}`) }));

  return (
    <footer className="border-t border-white/10 bg-background/50">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-2">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-1.5 rounded-md text-sm transition-all duration-200",
                    isActive
                      ? "text-white bg-white/5 border border-white/10"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-1.5 h-3.5 w-3.5",
                      isActive ? "text-neon-purple" : "text-gray-600"
                    )}
                  />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
