import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Briefcase,
  FolderOpen,
  User,
  PenTool,
  Menu,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { usePlugins } from "@/contexts/PluginsContext";
import { useSidebar } from "@/hooks/useSidebar";
import { useResume } from "@/hooks/useResume";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useQuery } from "@tanstack/react-query";
import { sidebarRepository, resumeRepository, portfolioRepository, homeRepository } from "@/repositories/instances";
import { generateCV } from "@/utils/cvPDF";
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
  const { locale, setLocale } = useI18n();
  const { isEnabled } = usePlugins();
  const [location] = useLocation();
  const { contactInfo } = useSidebar(sidebarRepository);
  const { items: resumeItems } = useResume(resumeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { data: aboutData } = useQuery({
    queryKey: ["home", "about"],
    queryFn: () => homeRepository.getAboutData(),
    staleTime: Infinity,
  });

  const NAV_ITEMS = NAV_ITEMS_KEYS
    .filter(item => !item.pluginId || isEnabled(item.pluginId))
    .map(item => ({ ...item, label: t(`navigation.${item.key}`) }));

  const handleDownloadCV = () => {
    if (!contactInfo) return;
    const cvLocale = locale === "en-US" ? "en-US" : "pt-BR";
    const summary = aboutData?.value?.[cvLocale] ?? aboutData?.value?.["pt-BR"] ?? "";
    generateCV(contactInfo, resumeItems, projects, cvLocale, summary);
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_ITEMS.map(item => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <a
              onClick={onClick}
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
    </>
  );

  return (
    <header className="sticky top-0 w-full h-16 bg-background/90 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-4 md:px-8">
      {/* Logo / site name */}
      <div className="flex items-center">
        <Link href="/">
          <a className="font-bold text-white text-sm hover:text-neon-purple transition-colors">
            {contactInfo?.name || "Portfolio"}
          </a>
        </Link>
      </div>

      {/* Desktop nav links */}
      <nav className="hidden md:flex items-center gap-1">
        <NavLinks />
      </nav>

      {/* Desktop profile dropdown */}
      <div className="hidden md:flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
              <div className="h-7 w-7 rounded-full overflow-hidden border border-white/20 flex items-center justify-center bg-white/5 text-xs font-bold text-white select-none">
                {contactInfo?.avatar_url ? (
                  <img src={contactInfo.avatar_url} alt={contactInfo.name || ""} className="h-full w-full object-cover" />
                ) : (
                  contactInfo?.name?.[0]?.toUpperCase() || <User className="h-3 w-3 opacity-50" />
                )}
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-background border border-white/10">
            <DropdownMenuItem
              onClick={handleDownloadCV}
              disabled={!contactInfo}
              className="cursor-pointer text-neon-lime focus:text-neon-lime focus:bg-neon-lime/10"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("sidebar.downloadCV")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="flex items-center justify-between px-2 py-2">
              <span className={cn("text-xs font-medium", locale === "pt-BR" ? "text-neon-lime" : "text-gray-400")}>PT</span>
              <Switch
                checked={locale === "en-US"}
                onCheckedChange={checked => setLocale(checked ? "en-US" : "pt-BR")}
                className="data-[state=checked]:bg-neon-purple"
              />
              <span className={cn("text-xs font-medium", locale === "en-US" ? "text-neon-lime" : "text-gray-400")}>EN</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 bg-background border-l border-white/10 p-0">
            <VisuallyHidden>
              <SheetTitle>{t("sidebar.menu")}</SheetTitle>
            </VisuallyHidden>
            <nav className="flex flex-col gap-1 p-4 pt-8">
              <NavLinks />
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadCV}
                  disabled={!contactInfo}
                  className="w-full border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10 h-9 text-xs uppercase tracking-wider"
                >
                  <FileText className="mr-2 h-3 w-3" />
                  {t("sidebar.downloadCV")}
                </Button>
                <div className="flex items-center justify-between px-1">
                  <span className={cn("text-xs font-medium", locale === "pt-BR" ? "text-neon-lime" : "text-gray-400")}>PT</span>
                  <Switch
                    checked={locale === "en-US"}
                    onCheckedChange={checked => setLocale(checked ? "en-US" : "pt-BR")}
                    className="data-[state=checked]:bg-neon-purple"
                  />
                  <span className={cn("text-xs font-medium", locale === "en-US" ? "text-neon-lime" : "text-gray-400")}>EN</span>
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
