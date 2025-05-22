"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
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
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

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
  requiredRole?: "family" | "owner" | "manager" | "friend";
}

interface NavigationSection {
  category: string;
  items: NavigationItem[];
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

interface SideNavigationProps {
  user: User | null;
}

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
      { name: "Cleaning", href: "/cleaning", icon: Sparkles },
      // Account settings moved to bottom
    ],
  },
  {
    category: "Admin",
    items: [
      {
        name: "Property Settings",
        href: "/admin/property",
        icon: CogIcon,
        requiredRole: "manager",
      },
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
  const { theme } = useTheme();
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

  const isActive = (href: string) => pathname === href;

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="fixed inset-y-0 left-0 w-64 hidden md:flex flex-col bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800 z-10">
      {/* Header/Logo - Now using the theme context */}
      <div className="p-6 border-b dark:border-gray-800 flex justify-center items-center">
        <div className="relative h-16 w-40">
          <Image
            src={
              isDarkMode ? "/images/logo-dark.svg" : "/images/logo-white.svg"
            }
            alt="Stia Logo"
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigationStructure.map((section) => {
          const isExpanded = expandedCategories[section.category] ?? true;

          return (
            <div key={section.category} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(section.category)}
                className={`w-full flex items-center justify-between text-left text-sm font-medium px-4 py-2 ${
                  document.documentElement.classList.contains("dark")
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                } mb-1 transition-colors duration-200`}
              >
                <span>{section.category}</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="space-y-1 pl-1">
                  {section.items.map((item) => {
                    if (
                      item.requiredRole &&
                      !hasPermission(item.requiredRole)
                    ) {
                      return null;
                    }

                    const IconComponent = item.icon || DocumentTextIcon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-2 text-sm rounded-md ${
                          isActive(item.href)
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <IconComponent
                          className={`
                            mr-3 flex-shrink-0 h-5 w-5
                            ${
                              isActive(item.href)
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

      {/* Account Settings at bottom */}
      <div className="px-3 py-4 border-t dark:border-gray-800 mt-auto">
        <Link
          href="/account"
          className={`flex items-center px-4 py-2 text-sm rounded-md ${
            isActive("/account")
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <UserIcon
            className={`
              mr-3 flex-shrink-0 h-5 w-5
              ${
                isActive("/account")
                  ? "text-gray-500"
                  : "text-gray-400 group-hover:text-gray-500"
              }
            `}
          />
          Account Settings
        </Link>
      </div>
    </div>
  );
}
