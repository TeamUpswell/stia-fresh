"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  Calendar,
  BarChart3,
  CheckCircle,
  Users,
  Settings,
  Inbox,
  MapPin,
  FileText,
  Bell,
  PhoneCall,
  Home,
} from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Stia</h2>
        <p className="text-sm text-gray-500">Property Management</p>
      </div>

      <div className="flex flex-col flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/dashboard")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Dashboard
        </Link>

        <Link
          href="/tasks"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/tasks")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CheckCircle className="w-5 h-5 mr-3" />
          Tasks
        </Link>

        <Link
          href="/calendar"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/calendar")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Calendar className="w-5 h-5 mr-3" />
          Calendar
        </Link>

        <Link
          href="/inventory"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/inventory")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Inbox className="w-5 h-5 mr-3" />
          Inventory
        </Link>

        <Link
          href="/manual"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/manual")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FileText className="w-5 h-5 mr-3" />
          House Manual
        </Link>

        <Link
          href="/recommendations"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/recommendations")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <MapPin className="w-5 h-5 mr-3" />
          Recommendations
        </Link>

        <Link
          href="/contacts"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/contacts")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <PhoneCall className="w-5 h-5 mr-3" />
          Contacts
        </Link>

        {user?.isAdmin && (
          <Link
            href="/admin/users"
            className={`flex items-center px-4 py-3 rounded-md ${
              isActive("/admin/users")
                ? "text-gray-900 bg-blue-50 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            User Management
          </Link>
        )}

        <Link
          href="/admin/property"
          className={`flex items-center px-4 py-3 rounded-md ${
            isActive("/admin/property")
              ? "text-gray-900 bg-blue-50 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Home className="w-5 h-5 mr-3" />
          Property Settings
        </Link>
      </div>
    </aside>
  );
}
