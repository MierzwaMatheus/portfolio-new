import { usePlugin } from '@/contexts/PluginsContext';
import { PluginId } from '../../convex/pluginRegistry';
import NotFound from '@/pages/NotFound';

export function PluginRoute({
  pluginId,
  children,
}: {
  pluginId: PluginId;
  children: React.ReactNode;
}) {
  const enabled = usePlugin(pluginId);
  if (!enabled) return <NotFound />;
  return <>{children}</>;
}
