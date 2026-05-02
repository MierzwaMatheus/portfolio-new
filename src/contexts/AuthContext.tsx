import { createContext, useContext, ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useLocation } from "wouter";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: string[];
  mustChangePassword: boolean;
  checkRole: (allowedKeys: string[]) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [, setLocation] = useLocation();

  const myRole = useQuery(
    api.users.getMyRole,
    isAuthenticated ? {} : "skip"
  );

  const mustChangePasswordData = useQuery(
    api.users.getMustChangePassword,
    isAuthenticated ? {} : "skip"
  );

  const roles: string[] = myRole ? [myRole as string] : [];
  const mustChangePassword = mustChangePasswordData ?? false;

  // Loading until auth is resolved AND, if authenticated, role has been fetched
  const isLoading =
    isAuthLoading || (isAuthenticated && myRole === undefined);

  const checkRole = (allowedKeys: string[]) => {
    if (!isAuthenticated || roles.length === 0) return false;
    if (roles.includes("root")) return true;
    return allowedKeys.some((key) => roles.includes(key));
  };

  const logout = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        roles,
        mustChangePassword,
        checkRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
