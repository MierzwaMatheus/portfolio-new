import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Code, Languages, Award, Heart } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useResume } from "@/hooks/useResume";
import { resumeRepository } from "@/repositories/instances";

export default function Resume() {
  const { t } = useTranslation();
  const { items, getItemsByType, isLoading } = useResume(resumeRepository);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const experience = getItemsByType("experience");
  const education = getItemsByType("education");
  const skills = getItemsByType("skill");
  const courses = getItemsByType("course");
  const languages = getItemsByType("language");
  const volunteer = getItemsByType("volunteer");
  const softSkills = getItemsByType("soft_skill");

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-display text-text-primary uppercase tracking-tight mb-4">
          {t('resume.title')}
        </h1>
        <p className="text-sm font-mono text-text-secondary">
          {t('resume.subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-12">
          {/* Experience Section */}
          {experience.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Briefcase className="w-4 h-4" /> {t('resume.experience')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-surface-card border-border-default hover:border-accent-purple transition-all duration-300 rounded-[6px] relative group overflow-hidden shadow-none">
                          <CardHeader className="pb-3 border-b border-border-subtle relative z-10">
                            <CardTitle className="text-lg font-bold font-display text-text-primary group-hover:text-accent-purple transition-colors">{content.role}</CardTitle>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">
                              <p className="text-accent-green font-mono text-xs uppercase tracking-widest">{content.company}</p>
                              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">{content.period}</p>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 relative z-10">
                            <div
                              className="text-text-secondary text-sm font-mono leading-relaxed prose prose-invert prose-p:mb-2 prose-ul:my-2 prose-li:my-0.5 max-w-none"
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <GraduationCap className="w-4 h-4" /> {t('resume.education')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-surface-card border-border-default hover:border-accent-purple transition-all duration-300 rounded-[6px] relative group overflow-hidden shadow-none">
                          <CardHeader className="pb-3 border-b border-border-subtle relative z-10">
                            <CardTitle className="text-lg font-bold font-display text-text-primary group-hover:text-accent-purple transition-colors">{content.degree}</CardTitle>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">
                              <p className="text-accent-green font-mono text-xs uppercase tracking-widest">{content.institution}</p>
                              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">{content.period}</p>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 relative z-10">
                            <div
                              className="text-text-secondary text-sm font-mono leading-relaxed prose prose-invert prose-p:mb-2 prose-ul:my-2 prose-li:my-0.5 max-w-none"
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Award className="w-4 h-4" /> {t('resume.courses')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface-card border border-border-default p-4 rounded-[6px] hover:border-accent-green transition-all duration-300 group shadow-none"
                      >
                        <p className="text-text-primary font-mono text-xs leading-relaxed group-hover:text-accent-green transition-colors">{content.text}</p>
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Heart className="w-4 h-4" /> {t('resume.volunteer')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface-card border border-border-default p-4 rounded-[6px] hover:border-accent-green transition-all duration-300 group shadow-none"
                      >
                        <p className="text-text-primary font-mono text-xs leading-relaxed group-hover:text-accent-green transition-colors">{content.text}</p>
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Code className="w-4 h-4" /> {t('resume.skills')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="space-y-2 group">
                          <div className="flex justify-between items-end">
                            <span className="text-text-primary font-mono text-xs uppercase tracking-widest group-hover:text-accent-purple transition-colors">{content.name}</span>
                            <span className="text-accent-green font-mono text-[10px]">{content.level}%</span>
                          </div>
                          <div className="h-1 bg-surface-elevated rounded-[1px] overflow-hidden border border-border-subtle">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${content.level}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-accent-purple opacity-80 group-hover:opacity-100 transition-opacity"
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Heart className="w-4 h-4" /> {t('resume.softSkills')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge variant="outline" className="bg-surface-elevated/30 border-border-default text-text-secondary hover:text-text-primary hover:border-accent-purple hover:bg-surface-elevated transition-colors font-mono uppercase tracking-widest text-[10px] py-1 px-3 rounded-[3px]">
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
              <h2 className="text-sm font-bold flex items-center gap-2 text-text-muted font-mono uppercase tracking-widest">
                <span className="text-accent-green">&gt;</span> <Languages className="w-4 h-4" /> {t('resume.languages')}
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
                    const content = item.translatedContent;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-surface-card border border-border-default p-4 rounded-[6px] hover:border-accent-purple transition-all duration-300 group shadow-none"
                      >
                        <h3 className="text-text-primary font-mono text-sm uppercase tracking-widest mb-1 group-hover:text-accent-purple transition-colors">{content.name}</h3>
                        <p className="text-accent-green font-mono text-[10px] uppercase tracking-widest">{content.level}</p>
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
  );
}
