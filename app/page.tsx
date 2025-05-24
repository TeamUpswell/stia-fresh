"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and user exists, redirect to dashboard
    if (!loading && user) {
      router.push("/dashboard");
    }

    // If auth is loaded and no user, redirect to auth page
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Stia</h1>
        <p className="text-gray-600 mb-6">
          Redirecting you to the right place...
        </p>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
