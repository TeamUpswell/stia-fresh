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
    assigned_to: "", // Add this field
  });
  // Fix the type here
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Add this with your other state variables
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<any[]>([]); // Add this state variable

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

  // Fetch users for assignment
  useEffect(() => {
    if (user) {
      async function fetchUsers() {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email");

        if (!error && data) {
          setUsers(data);
        }
      }

      fetchUsers();
    }
  }, [user]);

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
          assigned_to: formData.assigned_to || null, // Add this line
          status: "pending",
        },
      ]);

      if (error) throw error;

      setIsAddingTask(false);
      setFormData({
        title: "",
        description: "",
        due_date: "",
        assigned_to: "",
      });
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

  // Add this function after handleDeleteTask
  const handleUpdateTaskStatus = async (
    taskId: string,
    status: "pending" | "in_progress" | "completed"
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: status,
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Add this function to filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

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

            {/* Add this before the tasks.map block */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    statusFilter === "pending"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("in_progress")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    statusFilter === "in_progress"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    statusFilter === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Completed
                </button>
              </div>
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
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tasks
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new task
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon
                      className="-ml-1 mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    New Task
                  </button>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border">
                <p className="text-gray-500">
                  No tasks match the current filter
                </p>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`mb-4 p-4 border rounded-lg bg-white ${
                      task.status === "completed"
                        ? "border-green-200 bg-green-50"
                        : task.status === "in_progress"
                        ? "border-blue-200 bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between">
                      <h3
                        className={`font-medium text-lg ${
                          task.status === "completed"
                            ? "line-through text-gray-500"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>

                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-1">{task.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      {task.due_date && (
                        <p className="flex items-center">
                          <span className="mr-1">Due:</span>
                          <span
                            className={`${
                              new Date(task.due_date) < new Date() &&
                              task.status !== "completed"
                                ? "text-red-600 font-medium"
                                : ""
                            }`}
                          >
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                      {task.assigned_to && (
                        <p>
                          Assigned to:{" "}
                          {task.assigned_to === user?.id
                            ? "You"
                            : task.assigned_to}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      {/* Status update buttons */}
                      {task.status !== "completed" && (
                        <button
                          onClick={() =>
                            handleUpdateTaskStatus(task.id, "completed")
                          }
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-md"
                        >
                          Complete
                        </button>
                      )}

                      {task.status === "completed" && (
                        <button
                          onClick={() =>
                            handleUpdateTaskStatus(task.id, "pending")
                          }
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md"
                        >
                          Reopen
                        </button>
                      )}

                      {/* Claim button */}
                      {!task.assigned_to && (
                        <button
                          onClick={() => handleClaimTask(task.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
                        >
                          Claim Task
                        </button>
                      )}

                      {/* Delete button */}
                      {(task.created_by === user?.id ||
                        (hasPermission && hasPermission("manager"))) && (
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

                <div className="mb-4">
                  <label
                    htmlFor="assigned_to"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Assign To (Optional)
                  </label>
                  <select
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) =>
                      setFormData({ ...formData, assigned_to: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
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
