import { FloatingDock } from "./FloatingDock";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={cn("pb-28", className)}>
        {children}
      </main>
      <FloatingDock />
    </div>
  );
}
