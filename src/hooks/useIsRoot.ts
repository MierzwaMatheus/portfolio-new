import { useAuth } from '@/contexts/AuthContext';

export function useIsRoot() {
  const { roles } = useAuth();
  return roles.includes('root');
}
