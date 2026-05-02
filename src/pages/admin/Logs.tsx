import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_TYPES = [
  "admin.create",
  "admin.update",
  "admin.delete",
  "admin.reorder",
  "admin.publish",
  "admin.unpublish",
  "user.role_assigned",
  "user.role_removed",
  "contact.submitted",
  "contact.status_changed",
  "testimonial.submitted",
  "testimonial.approved",
  "testimonial.rejected",
  "testimonial.restored",
  "testimonial.published",
  "testimonial.unpublished",
  "testimonial.created",
];

const PLAYGROUND_EVENT_TYPES = [
  "playground.contact_submitted",
  "playground.proposal_signed",
  "playground.post_created",
  "playground.payment_link_created",
  "playground.ai_cv_generated",
];

const TARGET_TYPES = [
  "project",
  "post",
  "resumeItem",
  "aboutFaq",
  "aboutDailyRoutine",
  "homeContent",
  "contactInfo",
  "proposal",
  "checkout",
  "user",
  "contactRequest",
  "testimonialSubmission",
  "testimonial",
];

const EVENT_BADGE_VARIANTS: Record<string, string> = {
  "admin.create": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "admin.update": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "admin.delete": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "admin.reorder": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "admin.publish": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "admin.unpublish": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "user.role_assigned": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "user.role_removed": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "contact.submitted": "bg-neon-purple/20 text-purple-300 border border-purple-700/30",
  "contact.status_changed": "bg-blue-900/20 text-blue-300 border border-blue-700/30",
  "playground.contact_submitted": "bg-purple-900/20 text-purple-300 border border-purple-700/30",
  "playground.proposal_signed": "bg-blue-900/20 text-blue-300 border border-blue-700/30",
  "playground.post_created": "bg-green-900/20 text-green-300 border border-green-700/30",
  "playground.payment_link_created": "bg-yellow-900/20 text-yellow-300 border border-yellow-700/30",
  "playground.ai_cv_generated": "bg-pink-900/20 text-pink-300 border border-pink-700/30",
  "testimonial.submitted": "bg-blue-900/20 text-blue-300 border border-blue-700/30",
  "testimonial.approved": "bg-green-900/20 text-green-300 border border-green-700/30",
  "testimonial.rejected": "bg-red-900/20 text-red-300 border border-red-700/30",
  "testimonial.restored": "bg-yellow-900/20 text-yellow-300 border border-yellow-700/30",
  "testimonial.published": "bg-neon-lime/10 text-lime-300 border border-lime-700/30",
  "testimonial.unpublished": "bg-orange-900/20 text-orange-300 border border-orange-700/30",
  "testimonial.created": "bg-teal-900/20 text-teal-300 border border-teal-700/30",
};

type TabType = "system" | "playground";

function SystemLogs() {
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [targetType, setTargetType] = useState<string | undefined>(undefined);

  const logs = useQuery(api.audit.recent, {
    limit: 100,
    eventType: eventType || undefined,
    targetType: targetType || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Select value={eventType ?? "all"} onValueChange={(v) => setEventType(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {EVENT_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={targetType ?? "all"} onValueChange={(v) => setTargetType(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {TARGET_TYPES.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <LogTable
        logs={logs?.map(l => ({
          _id: l._id,
          createdAt: l.createdAt,
          eventType: l.eventType,
          success: l.success,
          metadata: l.metadata,
          actor: l.actorType === "system"
            ? { type: "system" as const }
            : l.actorType === "external"
            ? { type: "external" as const, email: ((l.metadata as Record<string, unknown> | null)?.email ?? (l.metadata as Record<string, unknown> | null)?.contactEmail) as string | undefined }
            : { type: "user" as const, email: l.actorEmail ?? l.actorId },
          entity: l.targetType
            ? { type: l.targetType, label: (l.metadata as Record<string, unknown> | null)?.label as string | undefined, id: l.targetId }
            : undefined,
        }))}
        emptyMessage="Nenhum log encontrado"
      />

      {logs && (
        <p className="text-xs text-muted-foreground text-right">
          {logs.length} registro{logs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function PlaygroundLogs() {
  const [eventType, setEventType] = useState<string | undefined>(undefined);

  const logs = useQuery(api.playground.getLogs, {
    limit: 100,
    eventType: eventType || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={eventType ?? "all"} onValueChange={(v) => setEventType(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {PLAYGROUND_EVENT_TYPES.map((et) => <SelectItem key={et} value={et}>{et}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Logs de sessões do playground público. TTL: 30 dias.</p>
      </div>

      <LogTable
        logs={logs?.map(l => ({
          _id: l._id,
          createdAt: l.createdAt,
          eventType: l.eventType,
          success: l.success,
          metadata: l.metadata,
          actor: { type: "external" as const, label: l.sessionId.slice(0, 8) + "…" },
          entity: undefined,
        }))}
        emptyMessage="Nenhuma ação no playground ainda"
        extraColumn={{ header: "Session", render: (log) => <code className="text-xs font-mono text-muted-foreground">{(log as { actor: { label?: string } }).actor.label}</code> }}
      />

      {logs && (
        <p className="text-xs text-muted-foreground text-right">
          {logs.length} registro{logs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

interface LogRow {
  _id: string;
  createdAt: number;
  eventType: string;
  success: boolean;
  metadata: unknown;
  actor:
    | { type: "system" }
    | { type: "external"; email?: string; label?: string }
    | { type: "user"; email?: string | null };
  entity?: { type: string; label?: string; id?: string };
}

function LogTable({
  logs,
  emptyMessage,
  extraColumn,
}: {
  logs: LogRow[] | undefined;
  emptyMessage: string;
  extraColumn?: { header: string; render: (log: LogRow) => React.ReactNode };
}) {
  const colSpan = extraColumn ? 6 : 6;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Data/Hora</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead className="w-16 text-center">Status</TableHead>
            <TableHead>Metadata</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs === undefined ? (
            <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
          ) : logs.length === 0 ? (
            <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">{emptyMessage}</TableCell></TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_BADGE_VARIANTS[log.eventType] ?? "bg-gray-100 text-gray-800"}`}>
                    {log.eventType}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {log.entity ? (
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{log.entity.type}</span>
                      {log.entity.label ? (
                        <span className="text-muted-foreground text-xs">{log.entity.label}</span>
                      ) : log.entity.id ? (
                        <span className="text-muted-foreground text-xs font-mono truncate max-w-32">{log.entity.id}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.actor.type === "system" ? (
                    <Badge variant="outline">sistema</Badge>
                  ) : log.actor.type === "external" ? (
                    <span className="flex flex-col gap-0.5">
                      <Badge variant="outline" className="text-[10px] w-fit">externo</Badge>
                      {log.actor.email && <span className="text-xs">{log.actor.email}</span>}
                      {!log.actor.email && log.actor.label && (
                        <code className="text-xs font-mono text-muted-foreground/70">{log.actor.label}</code>
                      )}
                    </span>
                  ) : log.actor.email ? (
                    <span>{log.actor.email}</span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {log.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell>
                  {log.metadata ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-default truncate max-w-32 inline-block">
                          {JSON.stringify(log.metadata)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminLogs() {
  const [tab, setTab] = useState<TabType>("system");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground text-sm mt-1">Histórico de ações realizadas no admin</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          <button
            onClick={() => setTab("system")}
            className={`px-4 py-2 text-sm font-mono transition-colors border-b-2 -mb-px ${tab === "system" ? "border-neon-purple text-neon-purple" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Sistema
          </button>
          <button
            onClick={() => setTab("playground")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-mono transition-colors border-b-2 -mb-px ${tab === "playground" ? "border-neon-purple text-neon-purple" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FlaskConical className="h-3.5 w-3.5" /> Playground
          </button>
        </div>

        {tab === "system" ? <SystemLogs /> : <PlaygroundLogs />}
      </div>
    </AdminLayout>
  );
}
