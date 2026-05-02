import { createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { PLUGIN_REGISTRY, PluginId } from '../../convex/pluginRegistry';

type PluginStates = Record<string, boolean>;

interface PluginsContextValue {
  states: PluginStates;
  isLoading: boolean;
  isEnabled: (id: PluginId) => boolean;
}

const PluginsContext = createContext<PluginsContextValue | null>(null);

export function PluginsProvider({ children }: { children: React.ReactNode }) {
  const states = useQuery(api.plugins.getPluginStates);
  const isLoading = states === undefined;

  const resolvedStates: PluginStates = {};
  for (const plugin of PLUGIN_REGISTRY) {
    resolvedStates[plugin.id] = states
      ? (states[plugin.id] ?? plugin.defaultEnabled)
      : plugin.defaultEnabled;
  }

  const isEnabled = (id: PluginId): boolean => resolvedStates[id] ?? true;

  return (
    <PluginsContext.Provider value={{ states: resolvedStates, isLoading, isEnabled }}>
      {children}
    </PluginsContext.Provider>
  );
}

export function usePlugins() {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error('usePlugins must be inside PluginsProvider');
  return ctx;
}

export function usePlugin(id: PluginId): boolean {
  return usePlugins().isEnabled(id);
}
