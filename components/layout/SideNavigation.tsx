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
      </nav>
    </aside>
  );
}
