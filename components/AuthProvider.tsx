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
  
  // Ensure this code runs (not bypassed)
  useEffect(() => {
    console.log("🔑 Auth Provider initialized");
    
    // Add this failsafe
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.log("⚠️ Auth check timed out - forcing loading to false");
    }, 3000);

    // Initial session check with proper error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log("🔑 Session check complete:", !!session);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: "owner" // Or get from database
          });
        } else {
          setUser(null);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error("❌ Session check error:", error);
        setLoading(false); // Important: still set loading to false on error
      });

    // Watch for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: "owner" // Temporary simplification
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

  const value = { user, loading, login, logout };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
