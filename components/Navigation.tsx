import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  HomeIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  PackageIcon,
  BookOpenIcon,
  StarIcon,
} from "lucide-react";

export default function Navigation() {
  const { hasPermission } = useAuth();
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      active: pathname === "/dashboard",
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: CalendarIcon,
      active: pathname === "/calendar",
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: ClipboardCheckIcon,
      active: pathname === "/tasks",
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: PackageIcon,
      active: pathname === "/inventory",
      requiredRole: "manager",
    },
    {
      name: "Manual",
      href: "/manual",
      icon: BookOpenIcon,
      active: pathname === "/manual",
    },
    {
      name: "Recommendations",
      href: "/recommendations",
      icon: StarIcon,
      active: pathname === "/recommendations",
    },
  ];

  return (
    <nav className="flex-shrink-0 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              // Skip items that require specific permissions the user doesn't have
              if (item.requiredRole && !hasPermission(item.requiredRole)) {
                return null;
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      item.active
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    } mr-3 flex-shrink-0 h-5 w-5`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
