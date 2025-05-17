"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

// Update the AppUser type definition to make email optional
type AppUser = {
  id: string;
  email?: string; // Make email optional to match Supabase's type
  roles: string[];
  isAdmin: boolean;
  isFamily: boolean;
  isManager: boolean;
} | null;

// Type for the context value
type AuthContextType = {
  user: AppUser;
  loading: boolean;
  error: any;
  hasPermission: (role: string) => boolean;
  hasAnyPermission: (roles: string[]) => boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Updated useState with proper type
  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    console.log("🔑 Auth Provider initialized");
    let isSubscribed = true;

    // Increase timeout to 20 seconds
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ Auth check timed out - forcing loading to false");
      if (isSubscribed) {
        setLoading(false);
        setUser(null);
      }
    }, 20000); // Increased from 10000

    // Initial session check with proper error handling
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔑 Session check complete:", !!session);

        if (session?.user && isSubscribed) {
          // Fetch the user's roles from the database
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          const roles = roleError ? [] : roleData?.map(r => r.role) || [];
          
          // Set user if component is still mounted
          if (isSubscribed) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              roles: roles,
              isAdmin: roles.includes('admin'),
              isFamily: roles.includes('family'),
              isManager: roles.includes('manager')
            });
            setLoading(false);
          }
        } else if (isSubscribed) {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Session check error:", error);
        if (isSubscribed) {
          setError(error);
          setLoading(false);
          setUser(null);
        }
      }
    };

    // Execute session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔑 Auth state changed:", event);
        checkSession();
      }
    );

    // Cleanup function
    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        success: !error,
        error: error,
        message: error ? error.message : "Success",
      };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const userRoles = user?.roles || [];

  const hasPermission = (requiredRole: string) => {
    if (!user || !userRoles) return false;

    // Check if user has the exact role
    if (userRoles.includes(requiredRole)) return true;

    // Role hierarchy - owners can access everything
    if (userRoles.includes("owner")) {
      return true; // Owners have access to everything
    }

    // Add more hierarchy rules if needed
    // e.g., if (userRoles.includes("manager") && (requiredRole === "family" || requiredRole === "guest")) return true;

    return false;
  };

  const value = {
    user,
    loading,
    error,
    hasPermission,
    hasAnyPermission: (roles: string[]) => {
      if (!user) return false;
      if (userRoles.includes("admin")) return true;
      return roles.some((role) => userRoles.includes(role));
    },
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
