"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { getMainProperty } from "@/lib/propertyService";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CreateCleaningTask() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomOptions, setRoomOptions] = useState([
    { id: "kitchen", label: "Kitchen" },
    { id: "living_room", label: "Living Room" },
    { id: "master_bedroom", label: "Master Bedroom" },
    { id: "guest_bedroom", label: "Guest Bedroom" },
    { id: "master_bathroom", label: "Master Bathroom" },
    { id: "guest_bathroom", label: "Guest Bathroom" },
    { id: "hallway", label: "Hallway" },
    { id: "outdoor_area", label: "Outdoor Area" },
  ]);

  // Initialize with the room from query params if available
  const defaultRoom = searchParams.get("room") || "";

  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    room: defaultRoom,
    photo_url: "",
    display_order: 0,
  });

  useEffect(() => {
    async function loadProperty() {
      const propertyData = await getMainProperty();
      setProperty(propertyData);
    }
    loadProperty();
  }, []);

  useEffect(() => {
    async function loadRoomTypes() {
      if (!property?.id) return;

      try {
        const { data, error } = await supabase
          .from("cleaning_room_types")
          .select("slug, name")
          .eq("property_id", property.id);

        if (error) throw error;

        if (data && data.length > 0) {
          // Add custom rooms to the options
          const customRoomOptions = data.map((room) => ({
            id: room.slug,
            label: room.name,
          }));

          setRoomOptions((prev) => [
            ...prev,
            { id: "custom_divider", label: "--- Custom Rooms ---", disabled: true },
            ...customRoomOptions,
          ]);
        }
      } catch (error) {
        console.error("Error loading room types:", error);
      }
    }

    loadRoomTypes();
  }, [property]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));

    try {
      setUploading(true);

      // Upload photo to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `cleaning-task-${Date.now()}.${fileExt}`;
      const filePath = `cleaning-tasks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cleaning-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from("cleaning-assets")
        .getPublicUrl(filePath);

      // Update form data with the photo URL
      setTaskData((prev) => ({
        ...prev,
        photo_url: data.publicUrl,
      }));

      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setTaskData((prev) => ({
      ...prev,
      photo_url: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !property) {
      toast.error("You must be logged in and have a property selected");
      return;
    }

    if (!taskData.name || !taskData.room) {
      toast.error("Name and room are required");
      return;
    }

    setLoading(true);

    try {
      // Create the new task
      const { data, error } = await supabase
        .from("cleaning_tasks")
        .insert([
          {
            property_id: property.id,
            name: taskData.name,
            task: taskData.name, // Set both name and task to the same value
            description: taskData.description,
            room: taskData.room,
            photo_url: taskData.photo_url,
            display_order: taskData.display_order || 0,
            is_completed: false, // Default value
          },
        ])
        .select();

      if (error) throw error;

      toast.success("Task created successfully");

      // Navigate back to the room's checklist
      router.push(`/cleaning/checklist/${taskData.room}`);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href={
              taskData.room
                ? `/cleaning/checklist/${taskData.room}`
                : "/cleaning/checklist"
            }
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Checklist
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-6">Create Cleaning Task</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task Name *
              </label>
              <input
                id="name"
                name="name"
                value={taskData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Clean microwave"
              />
            </div>

            {/* Room selection */}
            <div>
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Room *
              </label>
              <select
                id="room"
                name="room"
                value={taskData.room}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a room</option>
                {roomOptions.map((room) => (
                  <option 
                    key={room.id} 
                    value={room.id}
                    disabled={room.disabled}
                  >
                    {room.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={taskData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add detailed instructions if needed"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Photo (Optional)
              </label>

              {photoPreview ? (
                <div className="relative w-40 h-40">
                  <img
                    src={photoPreview}
                    alt="Task preview"
                    className="w-40 h-40 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-500"
                >
                  <Upload className="h-8 w-8 mb-1" />
                  <span className="text-xs">Upload Photo</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <p className="text-xs text-gray-500 mt-2">
                Upload a reference photo to help cleaners know what to do
              </p>
            </div>

            {/* Display order */}
            <div>
              <label
                htmlFor="display_order"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Display Order (Optional)
              </label>
              <input
                id="display_order"
                name="display_order"
                type="number"
                min="0"
                value={taskData.display_order}
                onChange={handleChange}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls the order tasks appear in the list (lower numbers
                appear first)
              </p>
            </div>

            {/* Submit button */}
            <div className="flex justify-end space-x-4">
              <Link href="/cleaning/history">
                <button
                  type="button" // Important to prevent form submission
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                >
                  View History
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading || uploading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading || uploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
