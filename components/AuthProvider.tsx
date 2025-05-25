"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const AuthContext = createContext({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  console.log("🔐 AuthProvider render state:", { user: !!user, loading });

  useEffect(() => {
    console.log("🔐 AuthProvider: Starting authentication check...");

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        console.log("🔐 Initial session check:", { session: !!session, error });

        if (session?.user) {
          setUser(session.user);
          console.log("✅ User authenticated:", session.user.id);
        } else {
          setUser(null);
          console.log("❌ No authenticated user");
        }
      } catch (error) {
        console.error("🔴 Error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state change:", event, !!session);

      if (session?.user) {
        setUser(session.user);
        console.log("✅ User signed in:", session.user.id);
      } else {
        setUser(null);
        console.log("❌ User signed out");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // ✅ Add login functions
  const signIn = async (email: string, password: string) => {
    console.log("🔐 Attempting sign in for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("🔴 Sign in error:", error);
      throw error;
    }

    console.log("✅ Sign in successful:", data.user?.id);
    return data;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log("🔐 Attempting sign up for:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error("🔴 Sign up error:", error);
      throw error;
    }

    console.log("✅ Sign up successful:", data.user?.id);
    return data;
  };

  const signOut = async () => {
    console.log("🔐 Signing out...");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("🔴 Sign out error:", error);
      throw error;
    }

    console.log("✅ Sign out successful");
  };

  const resetPassword = async (email: string) => {
    console.log("🔐 Sending password reset to:", email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("🔴 Password reset error:", error);
      throw error;
    }

    console.log("✅ Password reset email sent");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        supabase,
        signIn, // ← Add login function
        signUp, // ← Add signup function
        signOut, // ← Keep signout function
        resetPassword, // ← Add password reset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
