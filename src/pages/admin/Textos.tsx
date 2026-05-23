import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminTextos() {
  const [search, setSearch] = useState("");
  const allTexts = useQuery(api.siteTexts.getAll) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Textos do Site</h1>
        <Input
          placeholder="Buscar por chave ou conteúdo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="text-muted-foreground text-sm">{allTexts.length} textos carregados</p>
      </div>
    </AdminLayout>
  );
}
