"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      if (user) {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("priority", { ascending: false });

        if (data) setTasks(data);
        setLoading(false);
      }
    }

    loadTasks();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Task Management</h1>

      {loading ? (
        <div className="text-center">Loading tasks...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 bg-white shadow"
            >
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              <div className="mt-3 flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : task.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {task.priority}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    task.status === "pending"
                      ? "bg-gray-100 text-gray-800"
                      : task.status === "in-progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
