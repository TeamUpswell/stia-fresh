"use client";

import { useAuth } from "@/components/AuthProvider";
import SideNavigation from "@/components/layout/SideNavigation";
import { User, Key, Bell, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const accountNavItems = [
    { name: "Profile", href: "/account", icon: User },
    { name: "Security", href: "/account/security", icon: Key },
    { name: "Notifications", href: "/account/notifications", icon: Bell },
    { name: "Appearance", href: "/account/appearance", icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />

      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="container mx-auto px-4 pt-8">
            <h1 className="text-2xl font-semibold mb-6">Account Settings</h1>

            {/* Tab-style navigation - similar to property admin */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex -mb-px space-x-8">
                {accountNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const IconComponent = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        isActive
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <IconComponent
                        className={`mr-2 h-4 w-4 ${
                          isActive
                            ? "text-blue-500 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Content area */}
            <div className="py-2">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
