"use client";

import { useAuth } from "./AuthProvider";
import SideNavigation from "@/components/layout/SideNavigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SideNavigation user={user} />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}
