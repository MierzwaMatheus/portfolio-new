import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

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

export default function AdminTextos() {
  const [search, setSearch] = useState("");
  const allTexts = (useQuery(api.siteTexts.getAll) ?? []) as SiteText[];

  const filtered = useMemo(() => {
    if (!search.trim()) return allTexts;
    const q = search.toLowerCase();
    return allTexts.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.ptBR.toLowerCase().includes(q) ||
        (t.enUS ?? "").toLowerCase().includes(q)
    );
  }, [allTexts, search]);

  const grouped = useMemo(() => groupByPage(filtered), [filtered]);
  const namespaces = Object.keys(grouped).sort();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Textos do Site</h1>
        <Input
          placeholder="Buscar por chave ou conteúdo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-4">
          {namespaces.map((ns) => (
            <section key={ns}>
              <h2 className="text-lg font-semibold capitalize mb-2">{ns}</h2>
              <div className="space-y-2">
                {grouped[ns].map((item) => (
                  <div key={item._id} className="text-sm text-muted-foreground">
                    {item.key}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
