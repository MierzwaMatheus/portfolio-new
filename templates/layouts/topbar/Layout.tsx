import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className={cn("flex-1 w-full pt-16 min-h-screen transition-all duration-300", className)}>
        <div className="container mx-auto py-8 px-4 md:px-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
