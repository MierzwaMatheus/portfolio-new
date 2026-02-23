import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface-page text-text-primary flex flex-col lg:flex-row">
      <Sidebar />
      <main className={cn(
        "flex-1 w-full lg:ml-[240px] pt-4 lg:pt-0 min-h-screen transition-all duration-300",
        className
      )}>
        <div className="px-8 py-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
