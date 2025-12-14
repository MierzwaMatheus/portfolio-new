import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Route, RouteProps } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute(props: RouteProps) {
  const { user, isLoading, checkRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Check for required roles
  const hasAccess = checkRole(["all", "portfolio"]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-4">
          Você não tem permissão para acessar esta área.
        </p>
        <button
          onClick={() => window.location.href = "/"}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  return <Route {...props} />;
}
