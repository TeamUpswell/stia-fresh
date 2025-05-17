"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, User } from "@/components/AuthProvider"; // Import your custom User type
import {
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  WrenchIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

// Define interfaces for navigation items
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
  requiredRole?: "family" | "owner" | "manager" | "friend"; // Restrict to valid roles
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

interface SideNavigationProps {
  user: User | null; // Use your custom User type
}

// Define navigation structure with categories and items
const navigationStructure: NavigationSection[] = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    ],
  },
  {
    category: "Property Info",
    items: [
      {
        name: "House Manual",
        href: "/manual",
        icon: BookOpenIcon,
        requiredRole: "family",
      },
      {
        name: "Nearby Places",
        href: "/recommendations",
        icon: MapPinIcon,
        requiredRole: "family",
      },
      {
        name: "Checklists",
        href: "/checklists",
        icon: ClipboardDocumentListIcon,
        requiredRole: "family",
      },
      {
        name: "Contacts",
        href: "/contacts",
        icon: PhoneIcon,
        requiredRole: "family",
      },
    ],
  },
  {
    category: "Admin",
    items: [
      {
        name: "Users",
        href: "/admin/users",
        icon: UserGroupIcon,
        requiredRole: "owner",
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Cog6ToothIcon,
        requiredRole: "manager",
      },
    ],
  },
];

export default function SideNavigation({ user }: SideNavigationProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    General: true,
    "Property Info": true,
    Admin: false,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  return (
    <aside className="bg-white w-64 min-h-screen border-r border-gray-200 flex-shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Stia</h2>
        <p className="text-sm text-gray-500">Property Manager</p>
      </div>

      <nav className="p-4 space-y-4">
        {navigationStructure.map((section) => {
          // Only render section if user has permission for at least one item
          const hasPermittedItems = section.items.some(
            (item) => !item.requiredRole || hasPermission(item.requiredRole)
          );

          if (!hasPermittedItems) return null;

          return (
            <div key={section.category} className="space-y-2">
              <button
                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => toggleCategory(section.category)}
              >
                <span>{section.category}</span>
                {expandedCategories[section.category] ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>

              {expandedCategories[section.category] && (
                <div className="ml-2 space-y-1">
                  {section.items.map((item) => {
                    if (
                      item.requiredRole &&
                      !hasPermission(item.requiredRole)
                    ) {
                      return null;
                    }

                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Section - Only visible to owners */}
        {hasPermission("owner") && (
          <>
            <div className="mt-8 mb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
            </div>

            <nav className="mt-2 space-y-1">
              {/* User Management */}
              <Link
                href="/admin/users"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === "/admin/users"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    pathname === "/admin/users"
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                User Management
              </Link>

              {/* Property Settings */}
              <Link
                href="/admin/property"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === "/admin/property"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    pathname === "/admin/property"
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Property Settings
              </Link>

              {/* Account Settings */}
              <Link
                href="/admin/account"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === "/admin/account"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    pathname === "/admin/account"
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Account Settings
              </Link>

              {/* System Log */}
              <Link
                href="/admin/logs"
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === "/admin/logs"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    pathname === "/admin/logs"
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                System Logs
              </Link>
            </nav>
          </>
        )}
      </nav>
    </aside>
  );
}
