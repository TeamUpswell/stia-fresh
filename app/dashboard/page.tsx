"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
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
  Pencil,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { getMainProperty } from "@/lib/propertyService";

// Define types for your data
interface Property {
  id: string;
  name: string;
  main_photo_url?: string;
  address?: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  user_id: string;
}

interface DashboardStats {
  tasksCompleted: number;
  tasksInProgress: number;
  upcomingEvents: number;
  totalProjects: number;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompleted: 0,
    tasksInProgress: 0,
    upcomingEvents: 0,
    totalProjects: 0,
  });
  const [recentItems, setRecentItems] = useState<Task[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Add this function to your component
  async function validateImageUrl(url: string) {
    if (!url) return false;

    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      console.error("Image validation error:", error);
      return false;
    }
  }

  // Modify your useEffect for property loading
  useEffect(() => {
    async function loadPropertyData() {
      try {
        const propertyData = await getMainProperty();

        // Validate the image URL if it exists
        if (propertyData?.main_photo_url) {
          const isValid = await validateImageUrl(propertyData.main_photo_url);
          console.log(`Property image URL is ${isValid ? "valid" : "invalid"}`);

          if (!isValid) {
            // Try to fix common URL issues
            const fixedUrl = propertyData.main_photo_url
              .replace("/properties/properties/", "/properties/")
              .replace(/([^:]\/)\/+/g, "$1"); // Fix duplicate slashes

            if (fixedUrl !== propertyData.main_photo_url) {
              console.log("Attempting with fixed URL:", fixedUrl);
              const isFixedValid = await validateImageUrl(fixedUrl);

              if (isFixedValid) {
                propertyData.main_photo_url = fixedUrl;
                // Update in database too
                await supabase
                  .from("properties")
                  .update({ main_photo_url: fixedUrl })
                  .eq("id", propertyData.id);
              }
            }
          }
        }

        setProperty(propertyData);
      } catch (error) {
        console.error("Error loading property:", error);
      }
    }

    loadPropertyData();
  }, []);

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
          const completed = tasksData.filter(
            (t) => t.status === "completed"
          ).length;

          setStats({
            tasksCompleted: completed,
            tasksInProgress: tasksData.filter((t) => t.status === "in_progress")
              .length,
            upcomingEvents: 3, // Replace with actual count
            totalProjects: 2, // Replace with actual count
          });

          setRecentItems(tasksData as Task[]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    // Debug the image URL if it exists
    if (property?.main_photo_url) {
      console.log("Image URL:", property.main_photo_url);

      // Test if the URL is accessible
      fetch(property.main_photo_url, { method: "HEAD" })
        .then((res) => console.log("Image URL test:", res.status, res.ok))
        .catch((err) => console.error("Image URL error:", err));
    }
  }, [property]);

  useEffect(() => {
    async function cleanupImageUrls() {
      // Optional cleanup for existing images
      const { data: properties } = await supabase
        .from("properties")
        .select("id, main_photo_url")
        .not("main_photo_url", "is", null);

      for (const property of properties || []) {
        if (property.main_photo_url?.includes("/properties/properties/")) {
          const fixedUrl = property.main_photo_url.replace(
            "/properties/properties/",
            "/properties/"
          );
          await supabase
            .from("properties")
            .update({ main_photo_url: fixedUrl })
            .eq("id", property.id);
        }
      }
    }

    cleanupImageUrls();
  }, []);

  useEffect(() => {
    async function setupStorageBucket() {
      try {
        // First check if bucket access works at all
        const { data: buckets, error: listError } =
          await supabase.storage.listBuckets();

        if (listError) {
          console.log("Not an admin user - skipping bucket creation");
          return; // Exit early as we likely don't have admin access
        }

        // If we can list buckets, check if properties bucket exists
        const propertiesBucket = buckets?.find(
          (bucket) => bucket.name === "properties"
        );

        if (!propertiesBucket) {
          console.log(
            "Properties bucket doesn't exist, but may be created by admin"
          );
          // Try uploading a test file - the bucket might exist even if we can't see it
          await testBucketAccess();
        } else {
          console.log("Properties bucket exists");
          await testBucketAccess();
        }
      } catch (err) {
        console.log("Storage setup skipped - requires admin rights");
      }
    }

    // Separate function to test writing to the bucket
    async function testBucketAccess() {
      try {
        const testFile = new File(["test"], "test.txt", { type: "text/plain" });
        const { error: uploadError } = await supabase.storage
          .from("properties")
          .upload("test-permission-check.txt", testFile, { upsert: true });

        if (uploadError) {
          console.log(
            "Note: Cannot write to properties bucket - user has read-only access"
          );
        } else {
          console.log("Successfully wrote to properties bucket");
          // Clean up the test file
          await supabase.storage
            .from("properties")
            .remove(["test-permission-check.txt"]);
        }
      } catch (err) {
        console.log("Cannot access properties bucket for writing");
      }
    }

    setupStorageBucket();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Log for debugging
    console.log("File selected:", file.name, file.type, file.size);

    // Validate file type and size
    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename with UUID for reliability
      const fileExt = file.name.split(".").pop();
      const fileName = `property-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`; // Not adding "properties/" prefix - correct!

      console.log("Uploading to path:", filePath);

      // Upload to Supabase Storage with progress tracking
      const publicUrl = await uploadWithProgress(file, filePath);

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
          .insert([
            {
              name: "My Property",
              main_photo_url: publicUrl,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        setProperty(newProperty as Property);
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
          main_photo_url: publicUrl,
        });
        toast.success("Property image updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // A more comprehensive solution if you need actual progress tracking
  async function uploadWithProgress(
    file: File,
    filePath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      // Get pre-signed URL for direct upload
      supabase.storage
        .from("properties")
        .createSignedUploadUrl(filePath)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }

          xhr.open("PUT", data.signedURL);
          xhr.setRequestHeader("Cache-Control", "max-age=31536000");
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              // Get the public URL
              const { data: urlData } = supabase.storage
                .from("properties")
                .getPublicUrl(filePath);

              resolve(urlData.publicUrl);
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        })
        .catch(reject);
    });
  }

  // Add this to your component (you can call it from a button or useEffect)
  async function uploadTestImage() {
    try {
      // Create a simple canvas image
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 150;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#3498db";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText("Test Image", 10, 50);
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => resolve(blob!), "image/png")
      );

      // Upload to Supabase
      const fileName = `test-image-${Date.now()}.png`;
      console.log("Uploading test image:", fileName);

      const { data, error } = await supabase.storage
        .from("properties")
        .upload(fileName, blob, {
          cacheControl: "31536000", // 1 year for test images as well
          upsert: true,
        });

      if (error) throw error;

      // Get URL and log it
      const { data: urlData } = await supabase.storage
        .from("properties")
        .getPublicUrl(fileName);

      console.log("Test image uploaded successfully:", urlData.publicUrl);

      // Try to access it
      const response = await fetch(urlData.publicUrl, { method: "HEAD" });
      console.log("Test image accessibility:", response.status, response.ok);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Test upload failed:", err);
      return null;
    }
  }

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
            <div className="relative w-full h-full">
              {/* Replace Next.js Image with standard img tag for direct URL testing */}
              <img
                src={property.main_photo_url}
                alt={property.name || "Property"}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    property.main_photo_url
                  );
                  // Try to load the local placeholder
                  e.currentTarget.src = "/images/placeholder-property.jpg";
                  // Set up another error handler for the placeholder
                  e.currentTarget.onerror = () => {
                    console.error("Fallback image also failed");
                    // Proper TypeScript way to remove the event handler
                    (e.currentTarget as HTMLImageElement).onerror = () => {}; // Empty function instead of null
                    e.currentTarget.style.display = "none";

                    // Create a gradient fallback directly
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center";
                      fallback.innerHTML =
                        '<p class="text-white text-lg">Image unavailable</p>';
                      parent.appendChild(fallback);
                    }
                  };
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <p className="text-white text-lg">Add a property image</p>
            </div>
          )}

          {/* Image Upload Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                if (!isUploading) {
                  const fileInput = document.getElementById(
                    "property-image-upload"
                  );
                  if (fileInput) fileInput.click();
                }
              }}
              disabled={isUploading}
              type="button"
              className={`${
                isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } p-2 rounded-full shadow-lg transition-colors`}
              aria-label="Change property image"
            >
              {isUploading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Pencil className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Fix accessibility by adding a hidden label */}
            <label htmlFor="property-image-upload" className="sr-only">
              Upload property image
            </label>
            <input
              id="property-image-upload"
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              aria-label="Upload property image"
            />
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
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
              Welcome, {user?.email?.split("@")[0] || "Guest"}! Here&apos;s
              what&apos;s happening today.
            </p>
          </div>
        </div>

        {/* Property Information */}
        {property && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p>{property.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Address</h3>
                <p>{property.address}</p>
              </div>
              {/* Display other property info */}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-blue-100">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Tasks Completed
                </h3>
                <span className="text-2xl font-semibold">
                  {stats.tasksCompleted}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  In Progress
                </h3>
                <span className="text-2xl font-semibold">
                  {stats.tasksInProgress}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Upcoming Events
                </h3>
                <span className="text-2xl font-semibold">
                  {stats.upcomingEvents}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full p-3 bg-yellow-100">
                <Inbox className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Projects
                </h3>
                <span className="text-2xl font-semibold">
                  {stats.totalProjects}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tasks/new"
              className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <PlusCircle className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">New Task</h3>
              <p className="text-sm text-gray-500">Create a task or to-do</p>
            </Link>
            <Link
              href="/calendar/event/new"
              className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <Calendar className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">Schedule Event</h3>
              <p className="text-sm text-gray-500">Add to your calendar</p>
            </Link>
            <Link
              href="/inventory/new"
              className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <Inbox className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">Add to Inventory</h3>
              <p className="text-sm text-gray-500">Track new items</p>
            </Link>
            <Link
              href="/settings/profile"
              className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
            >
              <Settings className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">Account Settings</h3>
              <p className="text-sm text-gray-500">Update your profile</p>
            </Link>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/tasks"
              className="text-blue-600 text-sm hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {recentItems.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/tasks/${item.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">
                            {item.title || "Task title"}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.status || "pending"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.description?.substring(0, 100) ||
                            "No description available"}
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
                <Link
                  href="/tasks/new"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
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
