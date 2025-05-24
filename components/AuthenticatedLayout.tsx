"use client";

import { useAuth } from "@/lib/auth";
import SideNavigation from "@/components/layout/SideNavigation";
import Script from "next/script";

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
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
        strategy="afterInteractive"
      />
      <SideNavigation user={user} />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}
