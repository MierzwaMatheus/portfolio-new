import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Terminal,
  Cpu,
  Palette,
  Zap,
  Layout as LayoutIcon,
  MessageSquare,
  Quote
} from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { supabase } from "@/lib/supabase";

interface ContactInfo {
  role: string;
  role_translations?: {
    'pt-BR'?: string;
    'en-US'?: string;
  };
}

export default function Home() {
  const { t, tValue } = useTranslation();
  const { locale, isLoading: i18nLoading } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [aboutDataRaw, setAboutDataRaw] = useState<any>(null); // Dados brutos do JSONB
  const [servicesRaw, setServicesRaw] = useState<any[]>([]); // Dados brutos com JSONB completo
  const [testimonialsRaw, setTestimonialsRaw] = useState<any[]>([]); // Dados brutos com JSONB completo
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  // Deriva role traduzido baseado no locale atual (sem refetch)
  const contactRole = useMemo(() => {
    if (!contactInfo) return t('home.subtitle');
    // Extrai role traduzido baseado no locale atual
    const translatedRole = contactInfo.role_translations?.[locale] || contactInfo.role_translations?.['pt-BR'] || contactInfo.role || '';
    return translatedRole || t('home.subtitle');
  }, [contactInfo, locale, t]);

  // Busca dados apenas uma vez na montagem do componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Contact Info - busca role_translations também
        const { data: contactData, error: contactError } = await supabase
          .schema('app_portfolio')
          .from('contact_info')
          .select('role, role_translations')
          .single();
        if (contactError) {
          console.error("Error fetching contact info:", contactError);
        } else if (contactData) {
          setContactInfo(contactData as any);
        }

        // Fetch About - mantém o JSONB completo
        const { data: aboutData, error: aboutError } = await supabase
          .schema('app_portfolio')
          .from('content')
          .select('value')
          .eq('key', 'about_text')
          .single();
        
        if (aboutError) {
          console.error("Error fetching about:", aboutError);
        } else if (aboutData) {
          setAboutDataRaw(aboutData.value);
        }

        // Fetch Services - mantém dados brutos com JSONB completo
        const { data: servicesData, error: servicesError } = await supabase
          .schema('app_portfolio')
          .from('services')
          .select('id, title, description, title_translations, description_translations, created_at')
          .order('created_at');
        
        if (servicesError) {
          console.error("Error fetching services:", servicesError);
        } else if (servicesData) {
          setServicesRaw(servicesData);
        }

        // Fetch Testimonials - mantém dados brutos com JSONB completo
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .schema('app_portfolio')
          .from('testimonials')
          .select('id, name, role, text, text_translations, image_url, created_at')
          .order('created_at');
        
        if (testimonialsError) {
          console.error("Error fetching testimonials:", testimonialsError);
        } else if (testimonialsData) {
          setTestimonialsRaw(testimonialsData);
        }
      } catch (error) {
        console.error("Unexpected error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!i18nLoading) {
      fetchData();
    }
  }, [i18nLoading]); // Removido locale das dependências

  // Deriva aboutText baseado no locale atual (sem fazer fetch)
  const aboutText = (() => {
    if (!aboutDataRaw) return '';
    if (typeof aboutDataRaw === 'object' && aboutDataRaw !== null) {
      return aboutDataRaw[locale] || aboutDataRaw['pt-BR'] || '';
    }
    return typeof aboutDataRaw === 'string' ? aboutDataRaw : '';
  })();

  // Deriva services traduzidos baseado no locale atual (sem fazer fetch)
  const services = servicesRaw.map(service => ({
    id: service.id,
    title: service.title_translations?.[locale] || service.title_translations?.['pt-BR'] || service.title || '',
    description: service.description_translations?.[locale] || service.description_translations?.['pt-BR'] || service.description || '',
    created_at: service.created_at,
  }));

  // Deriva testimonials traduzidos baseado no locale atual (sem fazer fetch)
  const testimonials = testimonialsRaw.map(testimonial => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    text: testimonial.text_translations?.[locale] || testimonial.text_translations?.['pt-BR'] || testimonial.text || '',
    image_url: testimonial.image_url,
    created_at: testimonial.created_at,
  }));

  // Remove early return - renderiza conteúdo estático imediatamente

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-16 pb-12"
      >
        {/* Hero Section */}
        <motion.section variants={item}>
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-1.5 mb-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
              <Terminal className="w-3 h-3 text-neon-purple mr-2" />
              <p className="text-sm font-medium text-neon-purple font-mono">
                <span className="text-white mr-2">$</span>echo "{t('home.greeting')}"
              </p>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-4">
              <span className="text-neon-purple">{t('home.title')}</span> <br />
              <span className="relative inline-block">
                Matheus
                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-neon-lime rounded-full"></span>
              </span>
            </h1>

            <h2 className="text-2xl md:text-3xl mt-4 text-gray-400 font-light">
              {contactRole}
            </h2>

            <p className="max-w-2xl mt-8 text-gray-300 text-lg leading-relaxed border-l-2 border-neon-purple/50 pl-6">
              {t('home.hero.description')}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-10">
            {(tValue('home.hero.technologies') || []).map((tech: { name: string; color: string }) => (
              <div key={tech.name} className="flex items-center px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group cursor-default">
                <span className={`inline-block w-2 h-2 rounded-full ${tech.color} mr-3 shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:scale-125 transition-transform`}></span>
                <span className="text-sm font-medium text-gray-200">{tech.name}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* About Section */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span> {t('home.about.title')} <span className="text-neon-purple ml-2">*/</span>
          </h2>

          <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code className="w-24 h-24 text-neon-purple" />
            </div>

            <div className="relative z-10 space-y-6 text-gray-300 leading-relaxed text-lg">
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-600/30 rounded w-full"></div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {aboutText || t('home.about.loading')}
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Skills Grid */}
        <motion.section variants={item}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((skill, idx) => {
              const icons = [Zap, Terminal, LayoutIcon, Cpu];
              const Icon = icons[idx % icons.length];
              const isLastItem = idx === services.length - 1;
              const isOddCount = services.length % 2 !== 0;
              const shouldSpanFull = (services.length === 1) || (isLastItem && isOddCount);

              return (
                <div 
                  key={skill.id || idx} 
                  className={`bg-gradient-to-br from-[#1e1e1e] to-[#121212] p-8 rounded-xl border border-white/5 hover:border-neon-purple/30 transition-all duration-300 group hover:-translate-y-1 ${shouldSpanFull ? 'md:col-span-2' : ''}`}
                >
                  <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit group-hover:bg-neon-purple/10 transition-colors">
                    <Icon className="w-6 h-6 text-neon-lime" />
                  </div>
                  {isLoading ? (
                    <>
                      <div className="h-6 w-3/4 bg-gray-600/30 rounded mb-3 animate-pulse"></div>
                      <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-3 bg-gray-600/30 rounded w-full"></div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-neon-lime mb-3 group-hover:text-white transition-colors">{skill.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{skill.description}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section variants={item}>
          <h3 className="text-xl font-bold text-white mb-8 flex items-center">
            <MessageSquare className="w-5 h-5 text-neon-purple mr-3" />
            {t('home.testimonials.title')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={testimonial.id || idx} className="bg-gradient-to-br from-[#1e1e1e] to-[#121212] p-6 rounded-xl border border-white/5 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5" />
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 mr-4">
                    <img src={testimonial.image_url} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-neon-purple">{testimonial.role}</p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-3 bg-gray-600/30 rounded w-full"></div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic leading-relaxed">"{testimonial.text}"</p>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </Layout>
  );
}
