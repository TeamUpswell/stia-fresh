"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext<any>(null);

// If you added a bypass here, make sure to remove it or set to false
const BYPASS_AUTH = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Make sure you're not using mock data here
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ensure this code runs (not bypassed)
  useEffect(() => {
    console.log("🔑 Auth Provider initialized");
    
    // Add this failsafe
    const timeoutId = setTimeout(() => {
      console.warn("⚠️ Auth check timed out - forcing loading to false");
      setLoading(false);
    }, 10000); // Increase from 3 seconds to 10 seconds

    // Initial session check with proper error handling
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log("🔑 Session check complete:", !!session);
        
        if (session?.user) {
          // Fetch the user's roles from the database
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
            
          let roles = roleError ? [] : roleData.map(r => r.role);
          
          // Add this section - if no roles, check if first user and add admin
          if (roles.length === 0) {
            console.log("No roles detected, checking if first user...");
            // Check if this is the first user (no other roles exist)
            const { count } = await supabase
              .from("user_roles")
              .select("*", { count: "exact" });
              
            if (count === 0) {
              console.log("First user detected, assigning admin roles");
              // Add admin roles for first user
              await supabase.from("user_roles").insert([
                { user_id: session.user.id, role: "admin" },
                { user_id: session.user.id, role: "family" },
                { user_id: session.user.id, role: "manager" }
              ]);
              
              // Update roles array
              roles = ["admin", "family", "manager"];
            }
          }

          // Set user with roles
          setUser({
            ...session.user,
            roles: roles,
            isAdmin: roles.includes('admin'),
            isFamily: roles.includes('family'),
            isManager: roles.includes('manager')
          });
        } else {
          setUser(null);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error("❌ Session check error:", error);
        setError(error);
        setLoading(false); // Important: still set loading to false on error
      });

    // Watch for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch the user's roles from the database
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
          
        let roles = roleError ? [] : roleData.map(r => r.role);
        
        // Add this section - if no roles, check if first user and add admin
        if (roles.length === 0) {
          console.log("No roles detected, checking if first user...");
          // Check if this is the first user (no other roles exist)
          const { count } = await supabase
            .from("user_roles")
            .select("*", { count: "exact" });
            
          if (count === 0) {
            console.log("First user detected, assigning admin roles");
            // Add admin roles for first user
            await supabase.from("user_roles").insert([
              { user_id: session.user.id, role: "admin" },
              { user_id: session.user.id, role: "family" },
              { user_id: session.user.id, role: "manager" }
            ]);
            
            // Update roles array
            roles = ["admin", "family", "manager"];
          }
        }

        // Set user with roles
        setUser({
          ...session.user,
          roles: roles,
          isAdmin: roles.includes('admin'),
          isFamily: roles.includes('family'),
          isManager: roles.includes('manager')
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      });
      
      return { 
        success: !error, 
        error: error, 
        message: error ? error.message : "Success" 
      };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const userRoles = user?.roles || [];

  const value = {
    user,
    loading,
    error,
    hasPermission: (role: string) => {
      if (!user) return false;
      if (role === "any") return true; // Always allow "any" role
      if (userRoles.includes("admin")) return true; // Admin can do anything
      return userRoles.includes(role);
    },
    hasAnyPermission: (roles: string[]) => {
      if (!user) return false;
      if (userRoles.includes("admin")) return true; // Admin can do anything
      return roles.some(role => userRoles.includes(role));
    },
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
