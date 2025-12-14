import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Code, Languages, Award, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { PageSkeleton } from "@/components/PageSkeleton";

// Types
interface ResumeItem {
  id: string;
  type: string;
  content: any;
  order_index: number;
}

export default function Resume() {
  const [items, setItems] = useState<ResumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
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
            Currículo
          </h1>
          <p className="text-xl text-gray-400">
            Minha trajetória profissional, formação e habilidades.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            {/* Experience Section */}
            {experience.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Briefcase className="w-6 h-6" /> Experiência Profissional
                </h2>
                <div className="space-y-6">
                  {experience.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-card border-white/10 hover:border-neon-purple/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-xl text-white">{item.content.role}</CardTitle>
                          <p className="text-neon-green font-medium">{item.content.company}</p>
                          <p className="text-sm text-gray-400">{item.content.period}</p>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="text-gray-300 leading-relaxed prose prose-invert prose-headings:text-white prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 max-w-none [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-2 [&_ul]:ml-6 [&_ul]:pl-0 [&_li]:pl-2"
                            dangerouslySetInnerHTML={{ __html: item.content.description }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Education Section */}
            {education.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <GraduationCap className="w-6 h-6" /> Formação Acadêmica
                </h2>
                <div className="space-y-6">
                  {education.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-card border-white/10 hover:border-neon-purple/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-xl text-white">{item.content.degree}</CardTitle>
                          <p className="text-neon-green font-medium">{item.content.institution}</p>
                          <p className="text-sm text-gray-400">{item.content.period}</p>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="text-gray-300 leading-relaxed prose prose-invert prose-headings:text-white prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 max-w-none [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-2 [&_ul]:ml-6 [&_ul]:pl-0 [&_li]:pl-2"
                            dangerouslySetInnerHTML={{ __html: item.content.description }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Courses Section */}
            {courses.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Award className="w-6 h-6" /> Cursos e Certificações
                </h2>
                <div className="grid gap-4">
                  {courses.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-white/10 p-4 rounded-lg hover:border-neon-green/50 transition-colors"
                    >
                      <p className="text-gray-300">{item.content.text}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Volunteer Section */}
            {volunteer.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Heart className="w-6 h-6" /> Voluntariado
                </h2>
                <div className="grid gap-4">
                  {volunteer.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card border border-white/10 p-4 rounded-lg hover:border-neon-green/50 transition-colors"
                    >
                      <p className="text-gray-300">{item.content.text}</p>
                    </motion.div>
                  ))}
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
                  <Code className="w-6 h-6" /> Habilidades
                </h2>
                <div className="space-y-4">
                  {skills.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{item.content.name}</span>
                          <span className="text-neon-green">{item.content.level}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.content.level}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-neon-purple to-neon-green"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Soft Skills Section */}
            {softSkills.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Heart className="w-6 h-6" /> Soft Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {softSkills.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Badge variant="outline" className="border-neon-purple/50 text-gray-300 hover:bg-neon-purple/10 transition-colors py-1 px-3">
                        {item.content.text}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages Section */}
            {languages.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neon-purple">
                  <Languages className="w-6 h-6" /> Idiomas
                </h2>
                <div className="space-y-4">
                  {languages.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card border border-white/10 p-4 rounded-lg"
                    >
                      <h3 className="text-white font-medium">{item.content.name}</h3>
                      <p className="text-neon-green text-sm">{item.content.level}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
