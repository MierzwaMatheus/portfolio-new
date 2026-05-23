import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type SiteText = {
  _id: string;
  key: string;
  page: string;
  ptBR: string;
  enUS?: string;
};

function groupByPage(texts: SiteText[]): Record<string, SiteText[]> {
  return texts.reduce<Record<string, SiteText[]>>((acc, text) => {
    if (!acc[text.page]) acc[text.page] = [];
    acc[text.page].push(text);
    return acc;
  }, {});
}

function TextItem({
  item,
  onSave,
}: {
  item: SiteText;
  onSave: (key: string, ptBR: string, enUS: string) => void;
}) {
  const [ptBR, setPtBR] = useState(item.ptBR);
  const [enUS, setEnUS] = useState(item.enUS ?? "");

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{item.key}</span>
        {!item.enUS && (
          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
            Sem tradução EN
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Textarea
          value={ptBR}
          onChange={(e) => setPtBR(e.target.value)}
          placeholder="PT-BR"
          rows={2}
        />
        <Textarea
          value={enUS}
          onChange={(e) => setEnUS(e.target.value)}
          placeholder="EN-US"
          rows={2}
        />
      </div>
      <Button size="sm" onClick={() => onSave(item.key, ptBR, enUS)}>
        Salvar
      </Button>
    </div>
  );
}

export default function AdminTextos() {
  const [search, setSearch] = useState("");
  const allTexts = (useQuery(api.siteTexts.getAll) ?? []) as SiteText[];
  const update = useMutation(api.siteTexts.update);

  const filtered = useMemo(() => {
    if (!search.trim()) return allTexts;
    const q = search.toLowerCase();
    return allTexts.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.ptBR.toLowerCase().includes(q) ||
        (t.enUS ?? "").toLowerCase().includes(q),
    );
  }, [allTexts, search]);

  const grouped = useMemo(() => groupByPage(filtered), [filtered]);
  const namespaces = Object.keys(grouped).sort();

  async function handleSave(key: string, ptBR: string, enUS: string) {
    try {
      await update({ key, ptBR, enUS: enUS || undefined });
      toast.success("Texto salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar texto.");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Textos do Site</h1>
        <Input
          placeholder="Buscar por chave ou conteúdo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-6">
          {namespaces.map((ns) => (
            <section key={ns}>
              <h2 className="text-lg font-semibold capitalize mb-3">{ns}</h2>
              <div className="space-y-2">
                {grouped[ns].map((item) => (
                  <TextItem key={item._id} item={item} onSave={handleSave} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
