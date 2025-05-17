"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Sidebar from "./Sidebar";
import { Menu, User, LogOut } from "lucide-react";
import Link from "next/link";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/auth");
  };

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation for mobile */}
        <header className="bg-white border-b py-4 px-4 flex items-center justify-between md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 focus:outline-none"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="text-xl font-semibold">Stia</div>

          <div className="relative">
            <button 
              className="flex items-center focus:outline-none"
              aria-label="User profile"
            >
              <User className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-10">
            <div className="py-2">
              <Link href="/dashboard" className="block px-4 py-2 text-gray-600">
                Dashboard
              </Link>
              <Link href="/tasks" className="block px-4 py-2 text-gray-600">
                Tasks
              </Link>
              <Link href="/calendar" className="block px-4 py-2 text-gray-600">
                Calendar
              </Link>
              <Link href="/inventory" className="block px-4 py-2 text-gray-600">
                Inventory
              </Link>
              <Link href="/manual" className="block px-4 py-2 text-gray-600">
                House Manual
              </Link>
              <Link href="/recommendations" className="block px-4 py-2 text-gray-600">
                Recommendations
              </Link>
              <Link href="/contacts" className="block px-4 py-2 text-gray-600">
                Emergency Contacts
              </Link>
              {user?.isAdmin && (
                <Link href="/admin/users" className="block px-4 py-2 text-gray-600">
                  User Management
                </Link>
              )}
              <hr className="my-2" />
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-gray-600"
                aria-label="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between bg-white border-b px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {user?.email ? `Welcome, ${user.email.split('@')[0]}` : 'Welcome'}
            </h1>
          </div>
          <div className="flex items-center">
            <div className="relative mr-4">
              <button 
                className="relative p-2 bg-gray-100 rounded-full focus:outline-none"
                aria-label="User profile"
              >
                <User className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}