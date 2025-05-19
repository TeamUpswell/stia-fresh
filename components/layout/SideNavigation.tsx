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
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    General: true,
    Admin: false,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    // Check for saved preference
    const savedTheme = localStorage.getItem("theme");

    // Check system preference if no saved preference
    if (!savedTheme) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkMode(prefersDark);
      return;
    }

    setIsDarkMode(savedTheme === "dark");
  }, []);

  // Update body class and localStorage when theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  return (
    <aside
      className={`${
        isDarkMode ? "bg-gray-900" : "bg-white"
      } w-64 min-h-screen border-r ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      } flex-shrink-0 flex flex-col overflow-y-auto transition-colors duration-200`}
    >
      {/* Header/Logo - Centered */}
      <div
        className={`p-4 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        } flex items-center justify-center transition-colors duration-200`}
      >
        <Image
          src={isDarkMode ? "/branding/logo-dark.svg" : "/branding/logo.svg"}
          alt="Stia"
          width={100}
          height={32}
          priority
        />
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
                className={`w-full flex items-center justify-between text-left text-sm font-medium ${
                  isDarkMode
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
                          group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                          ${
                            isActive
                              ? isDarkMode
                                ? "bg-gray-800 text-white"
                                : "bg-gray-100 text-gray-900"
                              : isDarkMode
                              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
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

      {/* Theme Toggle Button */}
      <div
        className={`p-4 border-t ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        } flex justify-center transition-colors duration-200`}
      >
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-md ${
            isDarkMode
              ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } transition-colors duration-200`}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
