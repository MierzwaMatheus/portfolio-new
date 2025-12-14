import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  roles: string[]; // List of app_keys the user has access to
  checkRole: (allowedKeys: string[]) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setRoles([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_app_roles")
        .select("app_key, role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } else {
        // Combine app_keys and roles into a single array for permission checking
        const keys = data.map((row) => row.app_key);
        const userRoles = data.map((row) => row.role).filter(Boolean); // Filter out null/undefined roles
        setRoles(Array.from(new Set([...keys, ...userRoles]))); // Remove duplicates
      }
    } catch (error) {
      console.error("Unexpected error fetching roles:", error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRole = (allowedKeys: string[]) => {
    if (!user) return false;
    // 'all' key grants access to everything
    if (roles.includes("all")) return true;
    // Check if user has any of the allowed keys
    return allowedKeys.some((key) => roles.includes(key));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        roles,
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
