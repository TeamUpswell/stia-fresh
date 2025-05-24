"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMainProperty } from "@/lib/propertyService";
import { CheckCircle, AlertTriangle, ImagePlus, Settings, ClipboardList } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import SideNavigation from "@/components/layout/SideNavigation";

export default function CleaningDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [property, setProperty] = useState(null);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [pendingIssues, setPendingIssues] = useState(0);
  const [loading, setLoading] = useState(true);

  // Define navigation items
  const cleaningNavItems = [
    { name: "Cleaning Schedule", href: "/cleaning", icon: ClipboardList },
    { 
      name: "Manage Checklists", 
      href: "/cleaning/checklist/manage", 
      icon: Settings,
      requiredRole: "manager"
    }
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SideNavigation user={user} />
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="px-4 py-8">
            <h1 className="text-2xl font-semibold mb-6">Cleaning Management</h1>
            
            {/* Tab-style navigation - directly in the page */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex -mb-px space-x-8">
                {cleaningNavItems.map((item) => {
                  const isActive = pathname 
                    ? item.href === "/cleaning"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                    : false;
                  const IconComponent = item.icon;

                  // Create link element with key
                  const linkElement = (
                    <Link
                      href={item.href}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        isActive
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <IconComponent
                        className={`mr-2 h-4 w-4 ${
                          isActive
                            ? "text-blue-500 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );

                  // If item requires specific role, wrap with PermissionGate WITH A KEY
                  if (item.requiredRole) {
                    return (
                      <PermissionGate key={item.name} requiredRole={item.requiredRole}>
                        {linkElement}
                      </PermissionGate>
                    );
                  }
                  
                  // Return the link WITH A KEY 
                  return <div key={item.name}>{linkElement}</div>;
                })}
              </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cleaning Checklist Card */}
              <Link href="/cleaning/checklist">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    <h2 className="text-xl font-medium">Cleaning Checklist</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-400">Tasks completed</p>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{taskStats.completed}/{taskStats.total}</p>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                    <h2 className="text-xl font-medium">Issues & Reports</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-400">Pending issues</p>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{pendingIssues}</p>
                      {pendingIssues > 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">Needs attention</p>
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                      <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
                      <span className="text-sm font-medium">Report Issue</span>
                    </div>
                  </Link>
                  <Link href="/cleaning/checklist">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                      <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                      <span className="text-sm font-medium">Start Cleaning</span>
                    </div>
                  </Link>
                  <Link href="/cleaning/checklist?upload=true">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col items-center text-center">
                      <ImagePlus className="h-6 w-6 text-blue-500 mb-2" />
                      <span className="text-sm font-medium">Upload Photos</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
