"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Stia</h1>
      
      {user ? (
        <div className="mt-8">
          <p className="mb-4">Logged in as: {user.email}</p>
          <Link 
            href="/calendar" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go to Calendar
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-4">Please sign in to access the application</p>
          <Link 
            href="/auth" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Sign In
          </Link>
        </div>
      )}
    </main>
  );
}
