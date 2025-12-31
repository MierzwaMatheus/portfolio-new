import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Code, Languages, Award, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";

// Types
interface ResumeItem {
  id: string;
  type: string;
  content: any;
  content_translations?: {
    'pt-BR'?: any;
    'en-US'?: any;
  };
  order_index: number;
}

export default function Resume() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const [items, setItems] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get translated content based on locale
  const getTranslatedContent = (item: ResumeItem): any => {
    if (!item.content_translations) {
      return item.content;
    }
    
    // Tenta usar a tradução para o locale atual, depois pt-BR como fallback, depois content original
    return item.content_translations[locale as 'pt-BR' | 'en-US'] 
      || item.content_translations['pt-BR'] 
      || item.content;
  };

  useEffect(() => {
    fetchItems();
  }, []); // Busca apenas uma vez na montagem do componente

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .schema("app_portfolio")
        .from("resume_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Erro ao carregar dados do currículo");
    } finally {
      setIsLoading(false);
    }
  };

  const getItemsByType = (type: string) => items.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);

  if (isLoading) {
    return (
      <Layout>
        <PageSkeleton />
      </Layout>
    );
  }

  const experience = getItemsByType("experience");
  const education = getItemsByType("education");
  const skills = getItemsByType("skill");
  const courses = getItemsByType("course");
  const languages = getItemsByType("language");
  const volunteer = getItemsByType("volunteer");
  const softSkills = getItemsByType("soft_skill");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('resume.title')}
          </h1>
          <p className="text-xl text-gray-400">
            {t('resume.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            {/* Experience Section */}
            {experience.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Briefcase className="w-6 h-6" /> {t('resume.experience')}
                </h2>
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Card className="bg-card border-white/10">
                            <CardHeader>
                              <div className="h-6 bg-white/10 rounded w-3/4 mb-2 animate-pulse" />
                              <div className="h-4 bg-white/10 rounded w-1/2 mb-2 animate-pulse" />
                              <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse" />
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                                <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    experience.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-card border-white/10 hover:border-neon-purple/50 transition-colors">
                            <CardHeader>
                              <CardTitle className="text-xl text-white">{content.role}</CardTitle>
                              <p className="text-neon-green font-medium">{content.company}</p>
                              <p className="text-sm text-gray-400">{content.period}</p>
                            </CardHeader>
                            <CardContent>
                              <div 
                                className="text-gray-300 leading-relaxed prose prose-invert prose-headings:text-white prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 max-w-none [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-2 [&_ul]:ml-6 [&_ul]:pl-0 [&_li]:pl-2"
                                dangerouslySetInnerHTML={{ __html: content.description }}
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Education Section */}
            {education.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <GraduationCap className="w-6 h-6" /> {t('resume.education')}
                </h2>
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Card className="bg-card border-white/10">
                            <CardHeader>
                              <div className="h-6 bg-white/10 rounded w-3/4 mb-2 animate-pulse" />
                              <div className="h-4 bg-white/10 rounded w-1/2 mb-2 animate-pulse" />
                              <div className="h-4 bg-white/10 rounded w-1/4 animate-pulse" />
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    education.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-card border-white/10 hover:border-neon-purple/50 transition-colors">
                            <CardHeader>
                              <CardTitle className="text-xl text-white">{content.degree}</CardTitle>
                              <p className="text-neon-green font-medium">{content.institution}</p>
                              <p className="text-sm text-gray-400">{content.period}</p>
                            </CardHeader>
                            <CardContent>
                              <div 
                                className="text-gray-300 leading-relaxed prose prose-invert prose-headings:text-white prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 max-w-none [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-2 [&_ul]:ml-6 [&_ul]:pl-0 [&_li]:pl-2"
                                dangerouslySetInnerHTML={{ __html: content.description }}
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Courses Section */}
            {courses.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Award className="w-6 h-6" /> {t('resume.courses')}
                </h2>
                <div className="grid gap-4">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-card border border-white/10 p-4 rounded-lg"
                      >
                        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                      </motion.div>
                    ))
                  ) : (
                    courses.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-card border border-white/10 p-4 rounded-lg hover:border-neon-green/50 transition-colors"
                        >
                          <p className="text-gray-300">{content.text}</p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Volunteer Section */}
            {volunteer.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Heart className="w-6 h-6" /> {t('resume.volunteer')}
                </h2>
                <div className="grid gap-4">
                  {isLoading ? (
                    [1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-card border border-white/10 p-4 rounded-lg"
                      >
                        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                      </motion.div>
                    ))
                  ) : (
                    volunteer.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-card border border-white/10 p-4 rounded-lg hover:border-neon-green/50 transition-colors"
                        >
                          <p className="text-gray-300">{content.text}</p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-12">
            {/* Skills Section */}
            {skills.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Code className="w-6 h-6" /> {t('resume.skills')}
                </h2>
                <div className="space-y-4">
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
                            <div className="h-4 bg-white/10 rounded w-12 animate-pulse" />
                          </div>
                          <div className="h-2 bg-white/10 rounded-full animate-pulse" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    skills.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">{content.name}</span>
                              <span className="text-neon-green">{content.level}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${content.level}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-neon-purple to-neon-green"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Soft Skills Section */}
            {softSkills.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Heart className="w-6 h-6" /> {t('resume.softSkills')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                      </motion.div>
                    ))
                  ) : (
                    softSkills.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Badge variant="outline" className="border-neon-purple/50 text-gray-300 hover:bg-neon-purple/10 transition-colors py-1 px-3">
                            {content.text}
                          </Badge>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Languages Section */}
            {languages.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Languages className="w-6 h-6" /> {t('resume.languages')}
                </h2>
                <div className="space-y-4">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-card border border-white/10 p-4 rounded-lg"
                      >
                        <div className="h-5 bg-white/10 rounded w-1/2 mb-2 animate-pulse" />
                        <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
                      </motion.div>
                    ))
                  ) : (
                    languages.map((item, index) => {
                      const content = getTranslatedContent(item);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-card border border-white/10 p-4 rounded-lg"
                        >
                          <h3 className="text-white font-medium">{content.name}</h3>
                          <p className="text-neon-green text-sm">{content.level}</p>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
