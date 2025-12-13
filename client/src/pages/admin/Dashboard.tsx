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
  FileSignature
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Admin Sidebar Component
function AdminSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: FolderKanban, label: "Projetos", path: "/admin/projects" },
    { icon: FileText, label: "Blog", path: "/admin/blog" },
    { icon: User, label: "Currículo", path: "/admin/resume" },
    { icon: FileSignature, label: "Propostas", path: "/admin/proposals" },
    { icon: Home, label: "Home", path: "/admin/home" },
    { icon: Mail, label: "Contato", path: "/admin/contact" },
  ];

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
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-white/10 transform transition-transform duration-300 ease-in-out md:translate-x-0",
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
            {navItems.map((item) => {
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
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />
      <main className="md:ml-64 p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}

// Dashboard Page
export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Bem-vindo ao painel administrativo do seu portfólio.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Projetos", count: 12, icon: FolderKanban, color: "text-blue-400", bg: "bg-blue-400/10" },
            { title: "Artigos", count: 8, icon: FileText, color: "text-green-400", bg: "bg-green-400/10" },
            { title: "Propostas", count: 6, icon: FileSignature, color: "text-purple-400", bg: "bg-purple-400/10" },
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-white/10 rounded-xl p-6 flex items-center space-x-4">
              <div className={cn("p-4 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-8 h-8", stat.color)} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Atalhos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/projects">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50">
                <FolderKanban className="w-6 h-6 text-neon-purple" />
                Gerenciar Projetos
              </Button>
            </Link>
            <Link href="/admin/proposals">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50">
                <FileSignature className="w-6 h-6 text-neon-purple" />
                Criar Proposta
              </Button>
            </Link>
            <Link href="/admin/resume">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50">
                <User className="w-6 h-6 text-neon-purple" />
                Editar Currículo
              </Button>
            </Link>
            <Link href="/admin/contact">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50">
                <Mail className="w-6 h-6 text-neon-purple" />
                Ver Mensagens
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
