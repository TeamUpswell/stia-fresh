"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, User } from "@/components/AuthProvider";
import {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Package as PackageIcon,
  BookOpen as BookOpenIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Users as UserGroupIcon,
  Settings as CogIcon,
  ChevronRight,
  FileText as DocumentTextIcon,
} from "lucide-react";
import { useState } from "react";

// Define interfaces for navigation items
interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ForwardRefExoticComponent<
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

// Update the navigationStructure array with the correct icons
const navigationStructure: NavigationSection[] = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/", icon: HomeIcon },
      { name: "Calendar", href: "/calendar", icon: CalendarIcon },
      { name: "House Manual", href: "/manual", icon: BookOpenIcon },
      { name: "Nearby Places", href: "/recommendations", icon: StarIcon },
      { name: "Inventory", href: "/inventory", icon: PackageIcon },
      { name: "Contacts", href: "/contacts", icon: PhoneIcon },
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
        name: "Account Settings",
        href: "/admin/account",
        icon: CogIcon,
        requiredRole: "owner",
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
    Admin: false,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  return (
    <aside className="bg-white w-64 min-h-screen border-r border-gray-200 flex-shrink-0 flex flex-col overflow-y-auto">
      {/* Header/Logo */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Stia</h2>
        <p className="text-sm text-gray-500">Property Manager</p>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {navigationStructure.map((section) => {
          const isExpanded = expandedCategories[section.category] ?? true;

          return (
            <div key={section.category} className="space-y-1.5">
              {/* Category Header - Updated Style */}
              <button
                onClick={() => toggleCategory(section.category)}
                className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-600 hover:text-gray-900 mb-1"
              >
                <span>{section.category}</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Category Items - Updated Style to match Navigation.tsx */}
              {isExpanded && (
                <div className="space-y-1 pl-1">
                  {section.items.map((item) => {
                    // Skip items that require permissions user doesn't have
                    if (
                      item.requiredRole &&
                      !hasPermission(item.requiredRole)
                    ) {
                      return null;
                    }

                    const IconComponent = item.icon || DocumentTextIcon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center px-2 py-2 text-sm font-medium rounded-md
                          ${
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }
                        `}
                      >
                        <IconComponent
                          className={`
                            mr-3 flex-shrink-0 h-5 w-5
                            ${
                              isActive
                                ? "text-gray-500"
                                : "text-gray-400 group-hover:text-gray-500"
                            }
                          `}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Property Settings at bottom - Updated Style */}
      {hasPermission("manager") && (
        <div className="mt-auto border-t border-gray-200">
          <div className="p-3">
            <Link
              href="/admin/property"
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${
                  pathname === "/admin/property"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <CogIcon
                className={`
                  mr-3 flex-shrink-0 h-5 w-5
                  ${
                    pathname === "/admin/property"
                      ? "text-gray-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }
                `}
              />
              Property Settings
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
