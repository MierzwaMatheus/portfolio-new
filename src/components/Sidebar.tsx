import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Github,
  Linkedin,
  Mail,
  FileText,
  Home,
  Briefcase,
  FolderOpen,
  PenTool,
  Menu,
  User
} from "lucide-react";
import { SiBehance } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";

const NAV_ITEMS_KEYS = [
  { key: "home", href: "/", icon: Home },
  { key: "resume", href: "/curriculo", icon: Briefcase },
  { key: "portfolio", href: "/portfolio", icon: FolderOpen },
  { key: "about", href: "/sobre", icon: User },
  { key: "blog", href: "/blog", icon: PenTool },
];

const SOCIAL_CONFIG = [
  {
    key: 'github',
    label: "GitHub",
    icon: Github
  },
  {
    key: 'linkedin',
    label: "LinkedIn",
    icon: Linkedin
  },
  {
    key: 'behance',
    label: "Behance",
    icon: SiBehance
  }
];

interface ContactInfo {
  name: string;
  role: string;
  email: string;
  show_email: boolean;
  phone: string;
  show_phone: boolean;
  avatar_url: string;
  linkedin_url: string;
  github_url: string;
  behance_url: string;
}

export function Sidebar() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
  const [location] = useLocation();
  const [contactInfoRaw, setContactInfoRaw] = useState<any>(null); // Dados brutos com JSONB
  const [loading, setLoading] = useState(true);

  // Deriva role traduzido baseado no locale atual (sem refetch)
  const contactRole = useMemo(() => {
    if (!contactInfoRaw) return "Front-End Developer";
    return contactInfoRaw.role_translations?.[locale] || contactInfoRaw.role_translations?.['pt-BR'] || contactInfoRaw.role || "Front-End Developer";
  }, [contactInfoRaw, locale]);

  // Deriva contactInfo completo com role traduzido
  const contactInfo = useMemo((): ContactInfo | null => {
    if (!contactInfoRaw) return null;
    return {
      ...contactInfoRaw,
      role: contactRole,
    };
  }, [contactInfoRaw, contactRole]);

  const NAV_ITEMS = NAV_ITEMS_KEYS.map(item => ({
    ...item,
    label: t(`navigation.${item.key}`)
  }));

  const handleLanguageChange = (checked: boolean) => {
    setLocale(checked ? 'en-US' : 'pt-BR');
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .schema('app_portfolio')
        .from('contact_info')
        .select('id, name, role, role_translations, email, show_email, phone, show_phone, avatar_url, linkedin_url, github_url, behance_url')
        .single();

      if (error) throw error;
      if (data) {
        // Salva dados brutos (com JSONB completo) - a tradução será derivada via useMemo
        setContactInfoRaw(data);
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
    } finally {
      setLoading(false);
    }
  };

  const SidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-surface-sidebar border-r border-border-default w-full overflow-y-auto">
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          {loading ? (
            <Skeleton className="h-28 w-28 rounded-full mb-4" />
          ) : (
            <div className="relative h-28 w-28 rounded-full mb-4 overflow-hidden ring-2 ring-accent-purple ring-offset-2 ring-offset-[#0F0F0F] group cursor-pointer">
              <img
                src={contactInfo?.avatar_url || "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg"}
                alt={contactInfo?.name || "Matheus Mierzwa"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          )}

          {loading ? (
            <Skeleton className="h-6 w-40 mb-3" />
          ) : (
            <h1 className="font-display font-bold text-xl text-text-primary hover:text-accent-purple transition-colors mb-2 text-center">{contactInfo?.name || "Matheus Mierzwa"}</h1>
          )}

          <div className="w-full flex items-center justify-center px-2 py-2">
            <div className="text-xs text-center text-text-muted font-mono w-full">
              {loading ? (
                <div className="flex flex-col items-center gap-1 mb-1">
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="text-text-muted font-mono">
                  <span className="text-accent-purple/50">&lt;</span>
                  {contactInfo?.role || "Front-End Developer"}
                  <span className="text-accent-purple/50">/&gt;</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 py-2">
          <div className="h-[1px] w-full bg-border-subtle"></div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a className={cn(
                      "flex items-center py-3 text-sm font-mono transition-all duration-300 group relative",
                      isActive
                        ? "bg-accent-purple-subtle border-l-[3px] border-accent-purple text-text-primary pl-[calc(1rem-3px)]"
                        : "border-l-[3px] border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated pl-4"
                    )}>
                      <item.icon className={cn(
                        "mr-3 h-4 w-4 transition-colors",
                        isActive ? "text-accent-purple" : "text-text-secondary group-hover:text-accent-purple"
                      )} />
                      {item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className="mt-auto px-6 py-6 border-t border-border-default bg-surface-sidebar">
          <div className="mb-6 space-y-3 font-mono">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">{t('sidebar.contact')}</p>

            {loading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                {contactInfo?.show_email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-text-secondary hover:text-accent-green transition-colors group"
                  >
                    <Mail className="mr-2 h-3 w-3 text-text-muted group-hover:text-accent-green transition-colors" />
                    <span className="truncate">{contactInfo.email}</span>
                  </a>
                )}

                {contactInfo?.show_phone && (
                  <a
                    href={`https://wa.me/${contactInfo.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-text-secondary hover:text-accent-green transition-colors group"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-3 w-3 text-text-muted group-hover:text-accent-green transition-colors">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>{contactInfo.phone}</span>
                  </a>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center space-x-3 mb-6">
            {loading ? (
              <>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </>
            ) : (
              SOCIAL_CONFIG.map((social) => {
                const url = contactInfo?.[`${social.key}_url` as keyof ContactInfo] as string;
                if (!url) return null;

                return (
                  <a
                    key={social.key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-surface-elevated hover:bg-accent-purple/20 hover:text-accent-purple text-text-secondary transition-all duration-300 border border-border-default hover:border-accent-purple/30"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                );
              })
            )}
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-1">
              <span className={cn(
                "text-xs font-mono transition-colors",
                locale === 'pt-BR' ? "text-accent-purple" : "text-text-muted"
              )}>
                PT
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={locale === 'en-US'}
                  onCheckedChange={handleLanguageChange}
                  className="data-[state=checked]:bg-accent-purple"
                />
              </div>
              <span className={cn(
                "text-xs font-mono transition-colors",
                locale === 'en-US' ? "text-accent-purple" : "text-text-muted"
              )}>
                EN
              </span>
            </div>
          </div>

          <a
            href="/archives/CV - Matheus Mierzwa.pdf"
            download="CV - Matheus Mierzwa.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="w-full font-mono text-text-secondary border-border-default hover:border-accent-green hover:text-text-primary h-9 text-xs uppercase tracking-wider rounded-[4px]"
            >
              <FileText className="mr-2 h-3 w-3" />
              {t('sidebar.downloadCV')}
            </Button>
          </a>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-surface-sidebar/90 backdrop-blur-md border-b border-border-default z-50 flex items-center justify-between px-4 lg:hidden">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-accent-purple mr-3">
            <img
              src={contactInfo?.avatar_url || "https://i.postimg.cc/6pWwxrLf/IMG-20220823-232153-2.jpg"}
              alt={contactInfo?.name || "Matheus Mierzwa"}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display font-bold text-text-primary text-sm">{contactInfo?.name || "Matheus Mierzwa"}</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-text-primary hover:bg-surface-elevated rounded-[4px]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px] border-r border-border-default bg-surface-sidebar">
            <VisuallyHidden>
              <SheetTitle>{t('sidebar.menu')}</SheetTitle>
            </VisuallyHidden>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[240px] hidden lg:block z-50 bg-surface-sidebar border-r border-border-default">
        <SidebarContent />
      </aside>
    </>
  );
}
