"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { getMainProperty } from "@/lib/propertyService";
import { CheckCircle, AlertTriangle, ImagePlus, Home } from "lucide-react";

export default function CleaningDashboard() {
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [pendingIssues, setPendingIssues] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const propertyData = await getMainProperty();
        setProperty(propertyData);

        if (propertyData?.id) {
          // Get task statistics
          const { data: tasks, error: tasksError } = await supabase
            .from("cleaning_tasks")
            .select("is_completed")
            .eq("property_id", propertyData.id);

          if (tasksError) throw tasksError;
          
          setTaskStats({
            total: tasks?.length || 0,
            completed: tasks?.filter(task => task.is_completed).length || 0
          });

          // Get pending issues count
          const { data: issues, error: issuesError } = await supabase
            .from("cleaning_issues")
            .select("id")
            .eq("property_id", propertyData.id)
            .eq("is_resolved", false);

          if (issuesError) throw issuesError;
          
          setPendingIssues(issues?.length || 0);
        }
      } catch (error) {
        console.error("Error loading cleaning data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Cleaning Management</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cleaning Checklist Card */}
            <Link href="/cleaning/checklist">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h2 className="text-xl font-medium">Cleaning Checklist</h2>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Tasks completed</p>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{taskStats.completed}/{taskStats.total}</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{width: `${taskStats.total ? (taskStats.completed / taskStats.total) * 100 : 0}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Issue Reporting Card */}
            <Link href="/cleaning/issues">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                  <h2 className="text-xl font-medium">Issues & Reports</h2>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Pending issues</p>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{pendingIssues}</p>
                    {pendingIssues > 0 && (
                      <p className="text-sm text-amber-600">Needs attention</p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Quick Actions */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Link href="/cleaning/issues/create">
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                    <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
                    <span className="text-sm font-medium">Report Issue</span>
                  </div>
                </Link>
                <Link href="/cleaning/checklist">
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                    <span className="text-sm font-medium">Start Cleaning</span>
                  </div>
                </Link>
                <Link href="/cleaning/checklist?upload=true">
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                    <ImagePlus className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-sm font-medium">Upload Photos</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
