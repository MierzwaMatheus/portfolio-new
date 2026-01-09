import { Layout } from "@/components/Layout";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  return <Layout>{children}</Layout>;
}
