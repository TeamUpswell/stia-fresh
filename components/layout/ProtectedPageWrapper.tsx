"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

// DEVELOPMENT ONLY
const BYPASS_AUTH = false; // Change to false to restore auth

export default function ProtectedPageWrapper({
  children,
  requiresAuth = true,
}: {
  children: ReactNode;
  requiresAuth?: boolean;
}) {
  // COMPLETELY bypass all auth logic in development
  if (BYPASS_AUTH) {
    console.log("🔓 Auth bypassed for development");
    return <>{children}</>;
  }

  // Only run this code when not bypassing
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && requiresAuth) {
      console.log("🔒 Not authenticated, redirecting to auth");
      
      // FIXED: Only redirect if not already on auth page
      if (window.location.pathname !== '/auth') {
        router.push('/auth');
      }
    }
  }, [user, loading, router, requiresAuth]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return <>{children}</>;
}
