"use client";

import { useAuth } from "./AuthProvider";
import SideNavigation from "@/components/layout/SideNavigation";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SideNavigation user={user} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}