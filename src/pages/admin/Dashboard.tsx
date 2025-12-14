import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  User,
  Home,
  Mail,
  LogOut,
  Menu,
  X,
  FileSignature,
  UserPlus,
  Image as ImageIcon,
  Briefcase,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
import { ProposalDialog } from "@/components/admin/ProposalDialog";
import { ResumeExperienceDialog } from "@/components/admin/ResumeExperienceDialog";
import { ImagePicker } from "@/components/admin/ImagePicker";

// Admin Sidebar Component
function AdminSidebar() {
  const [location] = useLocation();
  const { logout, checkRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard", roles: ["root", "admin"] },
    { icon: FolderKanban, label: "Projetos", path: "/admin/projects", roles: ["root", "admin"] },
    { icon: FileText, label: "Blog", path: "/admin/blog", roles: ["root", "admin"] },
    { icon: User, label: "Currículo", path: "/admin/resume", roles: ["root", "admin"] },
    { icon: FileSignature, label: "Propostas", path: "/admin/proposals", roles: ["root", "admin", "proposal-editor"] },
    { icon: Home, label: "Home", path: "/admin/home", roles: ["root", "admin"] },
    { icon: Mail, label: "Contato", path: "/admin/contact", roles: ["root", "admin"] },
    { icon: UserPlus, label: "Criar Usuário", path: "/admin/users/new", roles: ["root"] },
  ];

  const filteredNavItems = navItems.filter(item => checkRole(item.roles));

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-white/10 transform transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="mb-8 flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-neon-purple flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredNavItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Admin Layout Wrapper
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white">
      <AdminSidebar />
      <main className="md:ml-64 p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}

// Dashboard Page
export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    articles: 0,
    proposals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      // Buscar contagem de projetos
      const { count: projectsCount } = await supabase
        .schema('app_portfolio')
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Buscar contagem de artigos (posts)
      const { count: articlesCount } = await supabase
        .schema('app_portfolio')
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Buscar contagem de propostas
      const { count: proposalsCount } = await supabase
        .schema('app_portfolio')
        .from('proposals')
        .select('*', { count: 'exact', head: true });

      setStats({
        projects: projectsCount || 0,
        articles: articlesCount || 0,
        proposals: proposalsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Bem-vindo ao painel administrativo do seu portfólio.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Projetos", count: stats.projects, icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-400/10" },
            { title: "Artigos", count: stats.articles, icon: FileText, color: "text-green-400", bg: "bg-green-400/10" },
            { title: "Propostas", count: stats.proposals, icon: FileSignature, color: "text-purple-400", bg: "bg-purple-400/10" },
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-white/10 rounded-xl p-6 flex items-center space-x-4">
              <div className={cn("p-4 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-8 h-8", stat.color)} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? "..." : stat.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Atalhos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsProjectOpen(true)}
            >
              <FolderKanban className="w-6 h-6 text-neon-purple" />
              Novo Projeto
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsProposalOpen(true)}
            >
              <FileSignature className="w-6 h-6 text-neon-purple" />
              Nova Proposta
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsExperienceOpen(true)}
            >
              <Briefcase className="w-6 h-6 text-neon-purple" />
              Nova Experiência
            </Button>

            <ImagePicker
              onSelect={() => { }}
              trigger={
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50">
                  <ImageIcon className="w-6 h-6 text-neon-purple" />
                  Galeria de Imagens
                </Button>
              }
            />
          </div>
        </div>

        <ProjectDialog
          open={isProjectOpen}
          onOpenChange={setIsProjectOpen}
          onSave={fetchStats}
        />

        <ProposalDialog
          open={isProposalOpen}
          onOpenChange={setIsProposalOpen}
          onSave={fetchStats}
        />

        <ResumeExperienceDialog
          open={isExperienceOpen}
          onOpenChange={setIsExperienceOpen}
          onSave={() => { }}
        />
      </div>
    </AdminLayout>
  );
}
