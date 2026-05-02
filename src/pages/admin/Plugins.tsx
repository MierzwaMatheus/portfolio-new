import { AdminLayout } from './Dashboard';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PLUGIN_REGISTRY } from '../../../convex/pluginRegistry';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Plugins() {
  const states = useQuery(api.plugins.getPluginStates);
  const setEnabled = useMutation(api.plugins.setPluginEnabled);

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      await setEnabled({ pluginId, enabled });
      toast.success(`Plugin ${enabled ? 'ativado' : 'desativado'} com sucesso`);
    } catch (err) {
      toast.error('Erro ao alterar plugin');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white">Plugins</h1>
          <p className="text-gray-400 mt-2">
            Ative ou desative funcionalidades independentes do sistema.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLUGIN_REGISTRY.map(plugin => {
            const enabled = states ? (states[plugin.id] ?? plugin.defaultEnabled) : plugin.defaultEnabled;
            return (
              <div
                key={plugin.id}
                className="bg-card border border-white/10 rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{plugin.label}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs border-white/20 text-gray-400"
                      >
                        {plugin.minRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{plugin.description}</p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={val => handleToggle(plugin.id, val)}
                    disabled={states === undefined}
                  />
                </div>

                {plugin.tables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plugin.tables.map(table => (
                      <span
                        key={table}
                        className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded font-mono"
                      >
                        {table}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
