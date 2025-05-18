"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout"; // Add this import
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
  Users,
  Pencil
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksInProgress: 0,
    upcomingEvents: 0,
    totalProjects: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [property, setProperty] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Fetch property data
    async function fetchPropertyData() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .single();

        if (!error && data) {
          setProperty(data);
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
      }
    }

    fetchPropertyData();
  }, [user]);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Log for debugging
    console.log("File selected:", file.name, file.type, file.size);
    
    // Validate file type and size
    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image must be less than 5MB");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create unique filename with UUID for reliability
      const fileExt = file.name.split('.').pop();
      const fileName = `property-${uuidv4()}.${fileExt}`;
      const filePath = `properties/${fileName}`;
      
      console.log("Uploading to path:", filePath);
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          },
        });
        
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      console.log("Public URL:", publicUrl);
      
      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }
      
      // Check if we have a property ID before updating
      if (!property?.id) {
        console.error("No property ID available");
        // Create a new property if one doesn't exist
        const { data: newProperty, error: createError } = await supabase
          .from("properties")
          .insert([{ 
            name: "My Property", 
            main_photo_url: publicUrl 
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        setProperty(newProperty);
        toast.success("Property created with new image!");
      } else {
        // Update existing property record
        const { error: updateError } = await supabase
          .from("properties")
          .update({ main_photo_url: publicUrl })
          .eq("id", property.id);
          
        if (updateError) throw updateError;
        
        // Update local state
        setProperty({
          ...property,
          main_photo_url: publicUrl
        });
        toast.success("Property image updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Property Hero Header */}
        <div className="relative rounded-xl overflow-hidden h-64 mb-8 group">
          {/* Property Image */}
          {property?.main_photo_url ? (
            <Image
              src={property.main_photo_url}
              alt={property.name || "Property"}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <p className="text-white text-lg">Add a property image</p>
            </div>
          )}

          {/* Image Upload Button - Better Solution */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                if (!isUploading) {
                  const fileInput = document.getElementById("property-image-upload");
                  if (fileInput) fileInput.click();
                }
              }}
              disabled={isUploading}
              type="button"
              className={`${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} p-2 rounded-full shadow-lg transition-colors`}
              aria-label="Change property image"
            >
              {isUploading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Pencil className="h-5 w-5 text-white" />
              )}
            </button>
            
            <input
              id="property-image-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
            />
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{width: `${uploadProgress}%`}}
                ></div>
              </div>
              <p className="text-white">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              {property?.name || "My Property"}
            </h1>
            <p className="text-white/80">
              Welcome, {user?.email?.split("@")[0] || "Guest"}! Here's what's happening today.
            </p>
          </div>
        </div>

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
    </AuthenticatedLayout>
  );
}