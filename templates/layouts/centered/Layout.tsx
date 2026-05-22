import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className={cn("flex-1 w-full", className)}>
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
