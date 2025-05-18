"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase, logSupabaseError, exploreTableSchema } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import DevHelper from './DevHelper';

// Define types for your data
type Reservation = {
  id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  status: string;
  adults: number;
  children?: number;
};

// Update your Task type to be more flexible
type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high";
  // Make these fields optional since we're not sure which one exists
  type?: string;
  category?: string;
  task_category?: string;
  task_type?: string;
  due_date?: string;
  assigned_to?: string;
  [key: string]: any; // Allow any additional fields
};

export default function Dashboard() {
  const { user } = useAuth();
  // Add proper types to your state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Use this once to examine your table structure
  useEffect(() => {
    if (user) {
      // Log the task table schema
      exploreTableSchema("tasks").then(columns => {
        if (columns) {
          console.log("Tasks table columns:", columns);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch upcoming reservations (this part is working fine)
        const { data: reservationData } = await supabase
          .from("reservations")
          .select("*")
          .gte("start_date", new Date().toISOString().split("T")[0])
          .order("start_date", { ascending: true })
          .limit(3);

        if (reservationData) {
          setReservations(reservationData as Reservation[]);
        }

        // Fetch tasks without the non-existent column filter
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .neq("status", "completed")
          .order("priority", { ascending: false });

        if (tasksError) {
          logSupabaseError(tasksError, "fetching tasks");
        }

        if (tasksData) {
          // Filter maintenance tasks with improved logic
          const maintenanceKeywords = [
            'maintenance', 
            'repair', 
            'fix', 
            'broken', 
            'replace', 
            'install',
            'plumbing',
            'electrical',
            'hvac',
            'appliance'
          ];
          
          const maintenanceTasks = tasksData.filter(task => {
            const title = task.title?.toLowerCase() || '';
            const description = task.description?.toLowerCase() || '';
            
            return maintenanceKeywords.some(keyword => 
              title.includes(keyword) || description.includes(keyword)
            );
          }).slice(0, 4); // Limit to 4 tasks
          
          setTasks(maintenanceTasks as Task[]);
        }
      } catch (error) {
        console.error("Error in fetchDashboardData:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      {/* Add the DevHelper component at the top of your Dashboard */}
      <DevHelper />
      
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg mb-8 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome, {user?.user_metadata?.full_name || "Guest"}
              </h1>
              <p className="opacity-90">
                {new Date().getHours() < 12
                  ? "Good morning! Ready to start your day?"
                  : new Date().getHours() < 18
                  ? "Good afternoon! Hope your day is going well."
                  : "Good evening! Here's a summary of your property."}
              </p>
            </div>
            
            {/* Optional: You could add weather or other useful info here */}
            <div className="hidden md:block text-right">
              <div className="text-sm opacity-75">Current Status</div>
              <div className="text-xl font-bold">Property Ready</div>
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Upcoming Stays</p>
              <p className="text-xl font-semibold">{reservations.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Tasks</p>
              <p className="text-xl font-semibold">{tasks.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Next Arrival</p>
              <p className="text-xl font-semibold">
                {reservations.length > 0
                  ? new Date(reservations[0].start_date).toLocaleDateString()
                  : "None"}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Property Status</p>
              <p className="text-xl font-semibold">Ready</p>
            </div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Reservations</h2>

          {reservations.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No upcoming reservations
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrive
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.guest_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(
                            reservation.start_date
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reservation.adults + (reservation.children || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Maintenance Tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Maintenance Tasks</h2>
            <button 
              onClick={() => window.location.href = '/tasks/new'} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              New Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              <p className="mb-4">No pending maintenance tasks</p>
              <button 
                onClick={() => window.location.href = '/tasks/new'} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create Task
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{task.title}</h3>
                      <div className="relative">
                        <button 
                          aria-label="Task options menu"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    
                    {/* Due date if available */}
                    {task.due_date && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                      
                      {/* Assigned to badge if available */}
                      {task.assigned_to && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {task.assigned_to}
                        </span>
                      )}
                      
                      {/* Complete task button */}
                      <button 
                        onClick={async () => {
                          // Update task status to completed
                          const { error } = await supabase
                            .from('tasks')
                            .update({ status: 'completed' })
                            .eq('id', task.id);
                            
                          if (error) {
                            logSupabaseError(error, "completing task");
                            return;
                          }
                          
                          // Refresh tasks
                          setTasks(tasks.filter(t => t.id !== task.id));
                        }}
                        className="ml-auto bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* View all link */}
              <div className="mt-4 text-right">
                <a 
                  href="/tasks?filter=maintenance" 
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center justify-end"
                >
                  View all maintenance tasks
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
