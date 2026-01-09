import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Code, HelpCircle } from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { supabase } from "@/lib/supabase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";

interface DailyRoutineItem {
  id: string;
  image_url: string;
  tags: string[];
  description: string;
  description_translations?: {
    'pt-BR'?: string;
    'en-US'?: string;
  };
  span_size: '1x1' | '1x2' | '2x1' | '2x2';
  display_order: number;
}

interface FAQItem {
  id: string;
  question: string;
  question_translations?: {
    'pt-BR'?: string;
    'en-US'?: string;
  };
  answer: string;
  answer_translations?: {
    'pt-BR'?: string;
    'en-US'?: string;
  };
  display_order: number;
}

export default function About() {
  const { t } = useTranslation();
  const { locale, isLoading: i18nLoading } = useI18n();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyRoutineRaw, setDailyRoutineRaw] = useState<any[]>([]);
  const [faqRaw, setFaqRaw] = useState<any[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Deriva daily routine traduzido baseado no locale atual
  const dailyRoutine = useMemo(() => {
    return dailyRoutineRaw.map((item) => ({
      ...item,
      description: item.description_translations?.[locale] || item.description_translations?.['pt-BR'] || item.description || '',
    }));
  }, [dailyRoutineRaw, locale]);

  // Deriva FAQ traduzido baseado no locale atual
  const faq = useMemo(() => {
    return faqRaw.map((item) => ({
      ...item,
      question: item.question_translations?.[locale] || item.question_translations?.['pt-BR'] || item.question || '',
      answer: item.answer_translations?.[locale] || item.answer_translations?.['pt-BR'] || item.answer || '',
    }));
  }, [faqRaw, locale]);

  useEffect(() => {
    if (i18nLoading) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch Daily Routine Items
        const { data: dailyData, error: dailyError } = await supabase
          .schema('app_portfolio')
          .from('daily_routine_items')
          .select('id, image_url, tags, description, description_translations, span_size, display_order')
          .order('display_order', { ascending: true });

        if (dailyError) {
          console.error("Error fetching daily routine:", dailyError);
        } else if (dailyData) {
          setDailyRoutineRaw(dailyData);
        }

        // Fetch FAQ Items
        const { data: faqData, error: faqError } = await supabase
          .schema('app_portfolio')
          .from('faq_items')
          .select('id, question, question_translations, answer, answer_translations, display_order')
          .order('display_order', { ascending: true });

        if (faqError) {
          console.error("Error fetching FAQ:", faqError);
        } else if (faqData) {
          setFaqRaw(faqData);
        }
      } catch (error) {
        console.error("Unexpected error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [i18nLoading]);

  const getSpanClasses = (spanSize: string) => {
    switch (spanSize) {
      case '1x2':
        return 'md:row-span-2';
      case '2x1':
        return 'md:col-span-2';
      case '2x2':
        return 'md:col-span-2 md:row-span-2';
      default:
        return '';
    }
  };

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16 pb-12"
    >
      {/* Sobre Mim Section */}
      <motion.section variants={item}>
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center font-mono">
          <span className="text-neon-purple mr-2">/*</span> {t('about.aboutMe.title')} <span className="text-neon-purple ml-2">*/</span>
        </h2>

        <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Code className="w-24 h-24 text-neon-purple" />
          </div>

          <div className="relative z-10 space-y-6 text-gray-300 leading-relaxed text-lg">
            <p className="whitespace-pre-wrap">
              {t('about.aboutMe.text')}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Meu Dia-a-Dia Section */}
      <motion.section variants={item}>
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center font-mono">
          <span className="text-neon-purple mr-2">/*</span> {t('about.dailyRoutine.title')} <span className="text-neon-purple ml-2">*/</span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : dailyRoutine.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 text-center text-gray-400">
            {t('about.dailyRoutine.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {dailyRoutine.map((routineItem) => (
              <motion.div
                key={routineItem.id}
                className={cn(
                  "relative group cursor-pointer rounded-xl border border-white/10 overflow-hidden",
                  "bg-gradient-to-br from-[#1e1e1e] to-[#121212]",
                  "hover:border-neon-purple/50 transition-all duration-300",
                  getSpanClasses(routineItem.span_size || '1x1')
                )}
                onMouseEnter={() => setHoveredItem(routineItem.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setHoveredItem(hoveredItem === routineItem.id ? null : routineItem.id)}
                variants={item}
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <img
                    src={routineItem.image_url}
                    alt={routineItem.description || ''}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Tags */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
                  {routineItem.tags?.map((tag: string, idx: number) => (
                    <Badge
                      key={idx}
                      className="bg-neon-purple/80 text-white border-none text-xs backdrop-blur-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Overlay com descrição */}
                <div
                  className={cn(
                    "absolute inset-0 bg-black/90 backdrop-blur-sm transition-all duration-300 z-20",
                    "flex items-center justify-center p-6",
                    hoveredItem === routineItem.id
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                >
                  <p className="text-white text-sm md:text-base leading-relaxed text-center">
                    {routineItem.description}
                  </p>
                </div>

                {/* Indicador de hover (mobile) */}
                {isMobile && hoveredItem !== routineItem.id && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
                      Toque para ver mais
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* FAQ Section */}
      <motion.section variants={item}>
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center font-mono">
          <span className="text-neon-purple mr-2">/*</span> {t('about.faq.title')} <span className="text-neon-purple ml-2">*/</span>
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-600/30 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-600/30 rounded w-full" />
              </div>
            ))}
          </div>
        ) : faq.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 text-center text-gray-400">
            {t('about.faq.empty')}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faq.map((faqItem, index) => (
                <AccordionItem
                  key={faqItem.id}
                  value={`faq-${faqItem.id}`}
                  className={cn(
                    "border-white/10",
                    index !== faq.length - 1 && "border-b"
                  )}
                >
                  <AccordionTrigger className="text-white hover:text-neon-purple px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-neon-purple shrink-0" />
                      <span className="text-left font-medium">{faqItem.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-300 leading-relaxed">
                    <p className="whitespace-pre-wrap">{faqItem.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

