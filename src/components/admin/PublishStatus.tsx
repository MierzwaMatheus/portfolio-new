import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function PublishStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["deploy-status"],
    queryFn: async () => {
      const { data } = await supabase
        .schema("app_portfolio")
        .from("deploy_status")
        .select("pending_changes, last_published_at")
        .single();
      return data;
    },
    refetchInterval: 30000,
  });

  const triggerDeploy = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-deploy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger deploy");
      }

      return response.json();
    },
    onSuccess: data => {
      if (data.skipped) {
        toast.info(data.message);
      } else {
        toast.success("Deploy iniciado com sucesso!");
      }
    },
    onError: error => {
      toast.error(`Erro ao iniciar deploy: ${error.message}`);
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
      { label: "ano", seconds: 31536000 },
      { label: "mês", seconds: 2592000 },
      { label: "dia", seconds: 86400 },
      { label: "hora", seconds: 3600 },
      { label: "minuto", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `há ${count} ${interval.label}${count > 1 ? "s" : ""}`;
      }
    }

    return "agora mesmo";
  };

  if (isLoading) return <Badge variant="secondary">Carregando...</Badge>;

  if (status?.pending_changes) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          Alterações Não Publicadas
        </Badge>
        <Button
          size="sm"
          onClick={() => triggerDeploy.mutate()}
          disabled={triggerDeploy.isPending}
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${triggerDeploy.isPending ? "animate-spin" : ""}`}
          />
          {triggerDeploy.isPending ? "Publicando..." : "Publicar Agora"}
        </Button>
      </div>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <CheckCircle className="w-3 h-3" />
      Publicado{" "}
      {status?.last_published_at
        ? formatTimeAgo(status.last_published_at)
        : "recentemente"}
    </Badge>
  );
}
