import { PageSkeleton } from "@/components/PageSkeleton";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Terminal,
  Cpu,
  Palette,
  Zap,
  Layout as LayoutIcon,
  MessageSquare,
  Quote,
} from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { useHome } from "@/hooks/useHome";
import { homeRepository } from "@/repositories/instances";
import { useMatrixText } from "@/hooks/useMatrixText";

export default function Home() {
  const { t, tValue } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const { contactRole, aboutText, services, testimonials, isLoading } =
    useHome(homeRepository);

  const matrixAboutText = useMatrixText({
    text: "Carregando informações do perfil...\n\nSincronizando dados do banco de dados, processando traduções e preparando experiência personalizada. Por favor, aguarde enquanto o sistema carrega todas as informações.",
    speed: 30,
    chars: "!@#$%^&*()_+-=[]{}|;:,.<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  });

  const matrixTestimonialText = useMatrixText({
    text: '"Carregando depoimento..."',
    speed: 30,
    chars: "!@#$%^&*()_+-=[]{}|;:,.<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  });

  // Fallback para contactRole se não houver dados
  const displayContactRole = contactRole || t("home.subtitle");

  if (isLoading || i18nLoading) {
    return <PageSkeleton />;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16 pb-12"
    >
      {/* Hero Section */}
      <motion.section variants={item} className="relative z-10 w-full mb-16">
        {/* Pulsating SVG Graph Background - Absolute Positioned */}
        <div className="absolute top-0 right-0 -z-10 opacity-20 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.circle cx="200" cy="200" r="150" stroke="var(--color-accent-purple)" strokeWidth="1" strokeDasharray="4 4" animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} />
            <motion.circle cx="200" cy="200" r="100" stroke="var(--color-accent-green)" strokeWidth="1" strokeDasharray="4 4" animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} />
            <motion.path d="M 50 200 L 350 200 M 200 50 L 200 350" stroke="#888888" strokeWidth="0.5" strokeOpacity="0.5" />
          </svg>
        </div>

        <div className="mb-12">
          {/* Giant Typography */}
          <h1 className="font-display text-[clamp(3.5rem,7vw,8rem)] font-bold text-text-primary leading-[1.1] tracking-tight mb-6">
            <span className="text-text-secondary block text-2xl md:text-3xl mb-4 font-mono">{t("home.greeting")}</span>
            Matheus<span className="text-accent-purple">.</span>
          </h1>

          {/* Terminal Output */}
          <div className="mt-8 font-mono text-sm md:text-base text-text-secondary bg-surface-sidebar p-6 rounded-[6px] border border-border-default max-w-2xl shadow-none">
            <div className="flex items-center text-text-muted mb-2">
              <Terminal className="w-4 h-4 mr-2" />
              <span>~/portfolio $</span>
              <span className="ml-2 text-text-primary">cat role.txt</span>
            </div>
            <div className="text-accent-green mb-4">
              <span className="mr-2 text-accent-green/50">&gt;</span>
              {displayContactRole}
            </div>
            <div className="flex items-center text-text-muted mb-2">
              <span>~/portfolio $</span>
              <span className="ml-2 text-text-primary">./bio.sh</span>
            </div>
            <p className="text-text-secondary leading-relaxed bg-surface-page p-4 border-l-2 border-accent-purple mt-2">
              {t("home.hero.description")}
            </p>
            <div className="mt-4 flex items-center">
              <span className="text-text-muted">~/portfolio $</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-accent-purple ml-3"
              >
                █
              </motion.span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-10">
          {(tValue("home.hero.technologies") || []).map(
            (tech: { name: string; color: string }) => (
              <div
                key={tech.name}
                className="flex items-center px-4 py-2 rounded-[3px] bg-surface-elevated border border-border-default hover:border-accent-green transition-colors group cursor-default"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary group-hover:text-text-primary transition-colors">
                  {tech.name}
                </span>
              </div>
            )
          )}
        </div>
      </motion.section>

      {/* About Section */}
      <motion.section variants={item}>
        <h2 className="text-xl font-bold text-text-primary mb-8 flex items-center font-mono uppercase tracking-wider">
          <span className="text-accent-purple mr-3">##</span>{" "}
          {t("home.about.title")}
        </h2>

        <div className="rounded-[6px] border border-border-default bg-surface-card p-8 py-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Code className="w-32 h-32 text-accent-purple" />
          </div>

          <div className="relative z-10 space-y-6 text-text-secondary leading-relaxed text-base font-mono">
            {isLoading ? (
              <p className="whitespace-pre-wrap text-accent-green">
                {matrixAboutText}
              </p>
            ) : (
              <p className="whitespace-pre-wrap">
                {aboutText || t("home.about.loading")}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Stack Section - Relational Diagram Concept */}
      <motion.section variants={item}>
        <h2 className="text-xl font-bold text-text-primary mb-8 flex items-center font-mono uppercase tracking-wider">
          <span className="text-accent-purple mr-3">##</span>{" "}
          Stack & Architecture
        </h2>

        <div className="relative w-full rounded-[6px] border border-border-default bg-surface-card p-10 overflow-hidden">
          {/* Connections Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20 hidden md:block">
            <svg width="100%" height="100%" className="absolute inset-0">
              <path d="M 25% 25% L 75% 25% L 75% 75% L 25% 75% Z" fill="none" stroke="var(--color-accent-purple)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M 50% 25% L 50% 75%" fill="none" stroke="var(--color-accent-green)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 w-full h-full">
            {services.map((skill, idx) => {
              const icons = [LayoutIcon, Cpu, Zap, Terminal];
              const Icon = icons[idx % icons.length];
              const positionClasses = [
                "md:justify-self-start md:self-start", // Top Left
                "md:justify-self-end md:self-start",   // Top Right
                "md:justify-self-start md:self-end",   // Bottom Left
                "md:justify-self-end md:self-end",     // Bottom Right
              ];

              return (
                <div
                  key={skill.id || idx}
                  className={`bg-surface-sidebar p-6 rounded-[4px] border border-border-default hover:border-accent-green transition-all duration-300 group hover:-translate-y-1 w-full md:max-w-xs ${positionClasses[idx % 4]}`}
                >
                  <div className="mb-4 flex items-center">
                    <div className="p-2 bg-surface-elevated rounded-[4px] border border-border-subtle group-hover:border-accent-purple transition-colors mr-4">
                      <Icon className="w-5 h-5 text-text-secondary group-hover:text-accent-purple transition-colors" />
                    </div>
                    {isLoading ? (
                      <div className="h-4 w-24 bg-surface-elevated rounded animate-pulse"></div>
                    ) : (
                      <h3 className="font-mono text-sm font-bold text-text-primary uppercase tracking-wider group-hover:text-accent-green transition-colors">
                        {skill.title}
                      </h3>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-2 animate-pulse mt-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-2 bg-surface-elevated rounded w-full"></div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed font-mono">
                      {skill.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section variants={item}>
        <h3 className="text-xl font-bold text-text-primary mb-8 flex items-center font-mono uppercase tracking-wider">
          <span className="text-accent-purple mr-3">##</span>{" "}
          {t("home.testimonials.title")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div
              key={testimonial.id || idx}
              className="bg-surface-card p-6 rounded-[4px] border border-border-default hover:border-accent-green transition-all duration-300 relative group"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-text-muted opacity-20 group-hover:text-accent-purple group-hover:opacity-100 transition-all duration-300" />
              <div className="flex items-center mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-border-subtle group-hover:border-accent-purple transition-colors mr-4">
                  <img
                    src={testimonial.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0A0A0A&color=F0F0F0`}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-text-primary uppercase tracking-wider">{testimonial.name}</p>
                  <p className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">{testimonial.role}</p>
                </div>
              </div>
              <div className="relative z-10 mt-6 pt-6 border-t border-border-subtle">
                {isLoading ? (
                  <p className="text-accent-green font-mono text-xs leading-relaxed">
                    {matrixTestimonialText}
                  </p>
                ) : (
                  <p className="text-text-secondary text-sm leading-relaxed font-mono">
                    "{testimonial.text}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
