"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  Calendar,
  Home,
  BarChart3,
  CheckCircle,
  Users,
  User,
  Settings,
  LogOut,
  Bell,
  Inbox,
  MapPin,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight, // Add this line
} from "lucide-react";

// Define types
interface Reservation {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  adults: number;
  children?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  priority?: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<Task[]>([]);
  const [propertyStats, setPropertyStats] = useState({
    occupancyRate: 68,
    upcomingStays: 0,
    pendingTasks: 0,
    lowInventory: 3,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch upcoming reservations
        const { data: reservationData } = await supabase
          .from("reservations")
          .select("*")
          .gte("check_in", new Date().toISOString().split("T")[0])
          .order("check_in", { ascending: true })
          .limit(3);

        if (reservationData) {
          setReservations(reservationData);
          setPropertyStats((prev) => ({
            ...prev,
            upcomingStays: reservationData.length,
          }));
        }

        // Fetch maintenance tasks
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("category", "maintenance")
          .neq("status", "completed") // Changed from not("status", "eq", "completed")
          .order("priority", { ascending: false })
          .limit(4);

        if (tasksData) {
          setMaintenanceTasks(tasksData);
          setPropertyStats((prev) => ({
            ...prev,
            pendingTasks: tasksData.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }

    fetchDashboardData();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Helper function to format dates nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
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
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-3 text-gray-900 bg-blue-50 rounded-md font-medium"
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/tasks" // Ensure this matches your actual route
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            Tasks
          </Link>
          <Link
            href="/calendar"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Calendar
          </Link>
          <Link
            href="/inventory"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Inbox className="w-5 h-5 mr-3" />
            Inventory
          </Link>
          <Link
            href="/manual"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <FileText className="w-5 h-5 mr-3" />
            House Manual
          </Link>
          <Link
            href="/recommendations"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <MapPin className="w-5 h-5 mr-3" />
            Recommendations
          </Link>
          <Link
            href="/contacts"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Bell className="w-5 h-5 mr-3" />
            Emergency Contacts
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin/users"
              className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
            >
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
              aria-label="Sign out of your account"
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
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen ? "true" : "false"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg">
            <div className="py-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-900 font-medium"
              >
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome to Stia
                </h1>
                <p className="text-gray-600">
                  Your property management assistant
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <Link
                  href="/calendar/event/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  New Reservation
                </Link>
              </div>
            </div>
          </header>

          {/* Add this debugging section to your dashboard */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-gray-100 rounded-lg mb-4">
              <h3 className="font-bold text-sm mb-2">Debug Info:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({
                  user: {
                    id: user?.id,
                    email: user?.email,
                    roles: user?.roles,
                    isAdmin: user?.isAdmin,
                    isFamily: user?.isFamily,
                    isManager: user?.isManager,
                  },
                }, null, 2)}
              </pre>
            </div>
          )}

          {/* Property Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Occupancy Rate
                  </h3>
                  <span className="text-2xl font-semibold">
                    {propertyStats.occupancyRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Upcoming Stays
                  </h3>
                  <span className="text-2xl font-semibold">
                    {propertyStats.upcomingStays}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Pending Tasks
                  </h3>
                  <span className="text-2xl font-semibold">
                    {propertyStats.pendingTasks}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-red-100">
                  <Inbox className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Low Inventory Items
                  </h3>
                  <span className="text-2xl font-semibold">
                    {propertyStats.lowInventory}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Reservations */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Reservations
                </h2>
                <Link
                  href="/calendar"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View calendar
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                {reservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Guest
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check Out
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {reservation.guest_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {reservation.adults +
                                      (reservation.children || 0)}{" "}
                                    guests
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(reservation.check_in)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(reservation.check_out)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  reservation.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : reservation.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {reservation.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No upcoming reservations</p>
                    <Link
                      href="/calendar/event/new"
                      className="text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Create a reservation
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Property Quick Links */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Property Management
              </h2>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="space-y-2">
                  <Link
                    href="/inventory"
                    className="flex items-center p-3 hover:bg-gray-50 rounded-md"
                  >
                    <Inbox className="h-5 w-5 text-blue-600" />
                    <span className="ml-3 font-medium text-gray-700">
                      Inventory
                    </span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </Link>
                  <Link
                    href="/manual"
                    className="flex items-center p-3 hover:bg-gray-50 rounded-md"
                  >
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="ml-3 font-medium text-gray-700">
                      House Manual
                    </span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </Link>
                  <Link
                    href="/recommendations"
                    className="flex items-center p-3 hover:bg-gray-50 rounded-md"
                  >
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="ml-3 font-medium text-gray-700">
                      Local Recommendations
                    </span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </Link>
                  <Link
                    href="/contacts"
                    className="flex items-center p-3 hover:bg-gray-50 rounded-md"
                  >
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span className="ml-3 font-medium text-gray-700">
                      Emergency Contacts
                    </span>
                    <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                  </Link>
                </div>

                {user?.roles?.includes("admin") ||
                user?.roles?.includes("owner") ? (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Administrator Tools
                    </h3>
                    <Link
                      href="/admin/users"
                      className="flex items-center p-3 hover:bg-gray-50 rounded-md bg-gray-50"
                    >
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="ml-3 font-medium text-gray-700">
                        User Management
                      </span>
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Maintenance Tasks */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Maintenance Tasks
              </h2>
              <Link
                href="/tasks?category=maintenance"
                className="text-blue-600 text-sm hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {maintenanceTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {maintenanceTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {task.priority === "high" ? (
                                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                              ) : task.priority === "medium" ? (
                                <span className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></span>
                              ) : (
                                <span className="h-2 w-2 bg-blue-500 rounded-full mr-3"></span>
                              )}
                              <p className="font-medium text-gray-900">
                                {task.title}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                task.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              Due: {formatDate(task.due_date)}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No maintenance tasks</p>
                  <Link
                    href="/tasks/new?category=maintenance"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Add maintenance task
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
