"use client";

import { useState, useEffect } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

// Add this hook to any component with loading states
function useLoadingTimeout(initialLoading = false, timeoutMs = 10000) {
  const [loading, setLoading] = useState(initialLoading);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => {
        setTimedOut(true);
      }, timeoutMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, timeoutMs]);

  return {
    loading,
    setLoading,
    timedOut,
    setTimedOut, // Add this line to expose the setTimedOut function
  };
}

// Define Task type
interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  created_by: string;
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
}

// Add with your other interfaces
interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order_index: number;
}

export default function TasksPage() {
  const { user, hasPermission } = useAuth();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  // Fix the type here
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  // Fetch tasks
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      console.log("Fetching sections...");
      const startTime = performance.now();

      const { data, error, status } = await supabase
        .from("manual_sections")
        .select("*")
        .order("order_index");

      const endTime = performance.now();
      console.log(`Sections query completed in ${endTime - startTime}ms`);

      if (error) {
        console.error("Error fetching sections:", error);
        console.error("Status code:", status);
        throw error;
      }

      console.log(`Received ${data?.length || 0} sections`);
      setSections(data || []);

      // If no sections found and no explicit error, log this condition
      if (!data || data.length === 0) {
        console.warn(
          "No sections found in database, this may be expected for new setups"
        );
      }
    } catch (error) {
      console.error("Exception in fetchSections:", error);
      // Set an error state that can be shown to users
      setError(
        "Failed to load sections. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("tasks").insert([
        {
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date || null,
          created_by: user.id,
          assigned_to: null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setIsAddingTask(false);
      setFormData({ title: "", description: "", due_date: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Claim a task
  const handleClaimTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: user.id,
          status: "in_progress",
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error claiming task:", error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("created_by", user.id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="family"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Sorry, you need family member permissions to access tasks.
            </p>
          </div>
        }
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Tasks</h1>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => setIsAddingTask(true)}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Task
              </button>
            </div>

            {loading && !timedOut ? (
              <div>Loading...</div>
            ) : timedOut ? (
              <div className="text-center p-8">
                <p className="text-red-500">Loading timed out</p>
                <p className="text-gray-600 mt-1">
                  There might be an issue connecting to the database.
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={() => {
                    setTimedOut(false); // This now works
                    setLoading(true);
                    fetchTasks();
                  }}
                >
                  Retry
                </button>
                <button
                  className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                  onClick={() => (window.location.href = "/admin/diagnostics")}
                >
                  Run Diagnostics
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Add your first task to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="mb-4 p-4 border rounded-lg bg-white"
                  >
                    <h3 className="font-medium text-lg">{task.title}</h3>
                    <p className="text-gray-600 mt-1">{task.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <p>Status: {task.status.replace("_", " ")}</p>
                      {task.due_date && (
                        <p>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      {!task.assigned_to && (
                        <button
                          onClick={() => handleClaimTask(task.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
                        >
                          Claim Task
                        </button>
                      )}

                      {(task.created_by === user?.id ||
                        hasPermission("manager")) && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-md"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Task Modal */}
        {isAddingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Add New Task</h2>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                  title="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="p-4">
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Task title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Task description"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="due-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="due-date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
