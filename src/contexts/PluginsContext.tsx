import { createContext, useContext, useEffect, useState } from 'react';
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

const IS_PROD = import.meta.env.PROD;

function defaultStates(): PluginStates {
  return Object.fromEntries(PLUGIN_REGISTRY.map(p => [p.id, p.defaultEnabled]));
}

function resolveStates(raw: Record<string, boolean> | undefined): PluginStates {
  const result: PluginStates = {};
  for (const plugin of PLUGIN_REGISTRY) {
    result[plugin.id] = raw ? (raw[plugin.id] ?? plugin.defaultEnabled) : plugin.defaultEnabled;
  }
  return result;
}

function StaticPluginsProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<PluginStates>(defaultStates);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/data/plugins.json')
      .then(r => r.ok ? r.json() : null)
      .then((raw: Record<string, boolean> | null) => setStates(resolveStates(raw ?? undefined)))
      .catch(() => setStates(defaultStates()))
      .finally(() => setIsLoading(false));
  }, []);

  const isEnabled = (id: PluginId): boolean => states[id] ?? true;

  return (
    <PluginsContext.Provider value={{ states, isLoading, isEnabled }}>
      {children}
    </PluginsContext.Provider>
  );
}

function ConvexPluginsProvider({ children }: { children: React.ReactNode }) {
  const raw = useQuery(api.plugins.getPluginStates);
  const states = resolveStates(raw);
  const isEnabled = (id: PluginId): boolean => states[id] ?? true;

  return (
    <PluginsContext.Provider value={{ states, isLoading: raw === undefined, isEnabled }}>
      {children}
    </PluginsContext.Provider>
  );
}

export function PluginsProvider({ children }: { children: React.ReactNode }) {
  return IS_PROD
    ? <StaticPluginsProvider>{children}</StaticPluginsProvider>
    : <ConvexPluginsProvider>{children}</ConvexPluginsProvider>;
}

export function usePlugins() {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error('usePlugins must be inside PluginsProvider');
  return ctx;
}

export function usePlugin(id: PluginId): boolean {
  return usePlugins().isEnabled(id);
}
