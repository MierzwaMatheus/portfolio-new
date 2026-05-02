import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, FileText, Check, X, RotateCcw, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SubmissionStatus = "pending" | "approved" | "rejected" | "published";

const TABS: { value: SubmissionStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "published", label: "Publicados" },
];

function VideoUsageBar() {
  const usage = useQuery(api.testimonialSubmissions.getDailyVideoUsage);

  if (!usage) return null;

  const percent = Math.min(100, (usage.usedMB / usage.limitMB) * 100);
  const color =
    percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-yellow-500" : "bg-neon-lime";

  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span className="flex-shrink-0">
        Vídeos hoje: {usage.usedMB} MB / {usage.limitMB} MB
      </span>
      <div className="flex-1 max-w-48 bg-white/10 rounded-full h-1.5">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface Submission {
  _id: Id<"testimonialSubmissions">;
  name: string;
  role: string;
  company?: string;
  email: string;
  type: "text" | "video";
  text?: string;
  videoUrl?: string | null;
  videoFileSize?: number;
  avatarUrl?: string | null;
  imageUrl?: string;
  status: SubmissionStatus;
  createdAt: number;
}

function SubmissionCard({ item }: { item: Submission }) {
  const approveMutation = useMutation(api.testimonialSubmissions.approve);
  const rejectMutation = useMutation(api.testimonialSubmissions.reject);
  const restoreMutation = useMutation(api.testimonialSubmissions.restore);
  const publishMutation = useMutation(api.testimonialSubmissions.publish);
  const approveAndPublishMutation = useMutation(api.testimonialSubmissions.approveAndPublish);

  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<unknown>) {
    setLoading(action);
    try {
      await fn();
      toast.success(
        action === "approve" ? "Aprovado com sucesso" :
        action === "reject" ? "Rejeitado" :
        action === "publish" ? "Publicado na home!" :
        action === "approveAndPublish" ? "Aprovado e publicado na home!" :
        "Restaurado para pendente",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  const initials = item.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const createdAt = new Date(item.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {(item.avatarUrl || item.imageUrl) ? (
            <img
              src={item.avatarUrl ?? item.imageUrl}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-white text-sm">{item.name}</p>
            <p className="text-xs text-gray-400">
              {item.role}
              {item.company ? ` · ${item.company}` : ""}
            </p>
            <p className="text-xs text-gray-600">{item.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            className={cn(
              "text-xs border",
              item.type === "video"
                ? "bg-neon-purple/20 text-neon-purple border-neon-purple/30"
                : "bg-blue-900/30 text-blue-400 border-blue-800/50",
            )}
          >
            {item.type === "video" ? (
              <><Video className="w-3 h-3 mr-1 inline" />Vídeo</>
            ) : (
              <><FileText className="w-3 h-3 mr-1 inline" />Texto</>
            )}
          </Badge>
          <span className="text-xs text-gray-600">{createdAt}</span>
        </div>
      </div>

      {item.type === "text" && item.text && (
        <p className="text-sm text-gray-300 italic leading-relaxed border-l-2 border-white/10 pl-3">
          "{item.text}"
        </p>
      )}

      {item.type === "video" && item.videoUrl && (
        <video
          src={item.videoUrl}
          controls
          className="w-full rounded-lg max-h-48 bg-black"
        />
      )}

      {item.type === "video" && !item.videoUrl && item.status === "rejected" && (
        <p className="text-xs text-gray-600 italic">Vídeo removido do storage</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {item.status === "pending" && (
          <>
            {item.type === "text" && (
              <Button
                size="sm"
                onClick={() => run("approveAndPublish", () => approveAndPublishMutation({ id: item._id }))}
                disabled={loading !== null}
                className="bg-neon-lime text-black hover:bg-neon-lime/90 text-xs font-semibold"
              >
                {loading === "approveAndPublish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Globe className="w-3 h-3 mr-1" />Aprovar e Publicar</>}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => run("approve", () => approveMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-green-700 text-green-400 hover:bg-green-900/20 text-xs"
            >
              {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Só Aprovar</>}
            </Button>
            <Button
              size="sm"
              onClick={() => run("reject", () => rejectMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Rejeitar</>}
            </Button>
          </>
        )}

        {item.status === "approved" && (
          <>
            {item.type === "text" && (
              <Button
                size="sm"
                onClick={() => run("publish", () => publishMutation({ id: item._id }))}
                disabled={loading !== null}
                className="bg-neon-lime text-black hover:bg-neon-lime/90 text-xs font-semibold"
              >
                {loading === "publish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Globe className="w-3 h-3 mr-1" />Publicar na Home</>}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => run("reject", () => rejectMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Rejeitar</>}
            </Button>
          </>
        )}

        {item.status === "rejected" && (
          <Button
            size="sm"
            onClick={() => run("restore", () => restoreMutation({ id: item._id }))}
            disabled={loading !== null}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-900/20 text-xs"
          >
            {loading === "restore" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" />Restaurar</>}
          </Button>
        )}

        {item.status === "published" && (
          <Badge className="bg-neon-lime/20 text-neon-lime border border-neon-lime/30 text-xs">
            <Globe className="w-3 h-3 mr-1 inline" />Publicado na home
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const [activeTab, setActiveTab] = useState<SubmissionStatus | "all">("pending");

  const submissions = useQuery(
    api.testimonialSubmissions.list,
    activeTab === "all" ? {} : { status: activeTab },
  ) as Submission[] | undefined;

  const pendingSubmissions = useQuery(api.testimonialSubmissions.list, { status: "pending" });
  const pendingCount = pendingSubmissions?.length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Depoimentos</h1>
            <p className="text-gray-400 text-sm mt-1">
              Modere e publique depoimentos enviados por visitantes
            </p>
          </div>
          <VideoUsageBar />
        </div>

        <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === tab.value
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-gray-300",
              )}
            >
              {tab.label}
              {tab.value === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 bg-neon-purple/40 text-neon-purple text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {submissions === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Nenhum depoimento {activeTab === "pending" ? "pendente" : activeTab === "approved" ? "aprovado" : activeTab === "rejected" ? "rejeitado" : "publicado"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((item) => (
              <SubmissionCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
