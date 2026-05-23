import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Loader2 } from "lucide-react";

export default function ContractTemplates() {
  const templates = useQuery(api.contractTemplates.list);
  const isLoading = templates === undefined;

  return (
    <AdminLayout>
      <div className="pt-20 md:pt-8 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Templates de Contrato</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gerencie os templates usados na geração de contratos PDF
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando templates...
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
