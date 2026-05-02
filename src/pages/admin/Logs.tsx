import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle } from "lucide-react";
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
};

export default function AdminLogs() {
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [targetType, setTargetType] = useState<string | undefined>(undefined);

  const logs = useQuery(api.audit.recent, {
    limit: 100,
    eventType: eventType || undefined,
    targetType: targetType || undefined,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground text-sm mt-1">Histórico de ações realizadas no admin</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select
            value={eventType ?? "all"}
            onValueChange={(v) => setEventType(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {EVENT_TYPES.map((et) => (
                <SelectItem key={et} value={et}>{et}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={targetType ?? "all"}
            onValueChange={(v) => setTargetType(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {TARGET_TYPES.map((tt) => (
                <SelectItem key={tt} value={tt}>{tt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          EVENT_BADGE_VARIANTS[log.eventType] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.eventType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.targetType ? (
                        <span>
                          <span className="font-medium">{log.targetType}</span>
                          {log.targetId && (
                            <span className="text-muted-foreground ml-1 text-xs font-mono truncate max-w-24 inline-block align-bottom">
                              {log.targetId}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.actorType === "system" ? (
                        <Badge variant="outline">sistema</Badge>
                      ) : log.actorEmail ? (
                        <span>{log.actorEmail}</span>
                      ) : log.actorId ? (
                        <span className="font-mono truncate max-w-32 inline-block">{log.actorId}</span>
                      ) : (
                        "—"
                      )}
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

        {logs && (
          <p className="text-xs text-muted-foreground text-right">
            {logs.length} registro{logs.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
