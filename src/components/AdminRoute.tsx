import { AdminLayout } from "@/pages/admin/Dashboard";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
