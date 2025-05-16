"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Calendar,
  Clock,
  BarChart3,
  CheckCircle,
  PlusCircle,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Inbox,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksInProgress: 0,
    upcomingEvents: 0,
    totalProjects: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch dashboard data
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Example query - replace with your actual data model
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!tasksError && tasksData) {
          // Calculate stats
          const completed = tasksData.filter(t => t.status === "completed").length;

          setStats({
            tasksCompleted: completed,
            tasksInProgress: tasksData.filter(t => t.status === "in_progress").length,
            upcomingEvents: 3, // Replace with actual count
            totalProjects: 2 // Replace with actual count
          });

          setRecentItems(tasksData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }

    fetchDashboardData();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-semibold text-gray-800">Stia</h1>
        </div>

        <div className="flex flex-col flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-900 bg-blue-50 rounded-md font-medium">
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link href="/tasks" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <CheckCircle className="w-5 h-5 mr-3" />
            Tasks
          </Link>
          <Link href="/calendar" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <Calendar className="w-5 h-5 mr-3" />
            Calendar
          </Link>
          <Link href="/inventory" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <Inbox className="w-5 h-5 mr-3" />
            Inventory
          </Link>
          {user?.isAdmin && (
            <Link href="/admin/users" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
              <Users className="w-5 h-5 mr-3" />
              User Management
            </Link>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10 px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-800">Stia</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg">
            <div className="py-2">
              <Link href="/dashboard" className="block px-4 py-2 text-gray-900 font-medium">Dashboard</Link>
              <Link href="/tasks" className="block px-4 py-2 text-gray-600">Tasks</Link>
              <Link href="/calendar" className="block px-4 py-2 text-gray-600">Calendar</Link>
              <Link href="/inventory" className="block px-4 py-2 text-gray-600">Inventory</Link>
              <hr className="my-2" />
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.email?.split("@")[0]}</h1>
            <p className="text-gray-600">Here's what's happening with your projects today.</p>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Tasks Completed</h3>
                  <span className="text-2xl font-semibold">{stats.tasksCompleted}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-green-100">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
                  <span className="text-2xl font-semibold">{stats.tasksInProgress}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Upcoming Events</h3>
                  <span className="text-2xl font-semibold">{stats.upcomingEvents}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-yellow-100">
                  <Inbox className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
                  <span className="text-2xl font-semibold">{stats.totalProjects}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/tasks/new" className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                <PlusCircle className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-medium">New Task</h3>
                <p className="text-sm text-gray-500">Create a task or to-do</p>
              </Link>
              <Link href="/calendar/event/new" className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Schedule Event</h3>
                <p className="text-sm text-gray-500">Add to your calendar</p>
              </Link>
              <Link href="/inventory/new" className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                <Inbox className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Add to Inventory</h3>
                <p className="text-sm text-gray-500">Track new items</p>
              </Link>
              <Link href="/settings/profile" className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                <Settings className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-medium">Account Settings</h3>
                <p className="text-sm text-gray-500">Update your profile</p>
              </Link>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/tasks" className="text-blue-600 text-sm hover:underline">
                View all
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {recentItems.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentItems.map((item, index) => (
                    <li key={index}>
                      <Link href={`/tasks/${item.id}`} className="block hover:bg-gray-50">
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{item.title || "Task title"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.status === "completed" ? "bg-green-100 text-green-800" : 
                              item.status === "in_progress" ? "bg-blue-100 text-blue-800" : 
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.status || "pending"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.description?.substring(0, 100) || "No description available"}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No recent activity to show</p>
                  <Link href="/tasks/new" className="text-blue-600 hover:underline mt-2 inline-block">
                    Create your first task
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}