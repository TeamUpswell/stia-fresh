"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { getMainProperty } from "@/lib/propertyService";
import {
  CheckCircle,
  ArrowLeft,
  Home,
  Utensils,
  Bath,
  LucideIcon,
} from "lucide-react";
import RoomCard from "../components/RoomCard";

// Define interfaces for our data structures
interface RoomStat {
  total: number;
  completed: number;
}

interface RoomType {
  id: string;
  name: string;
  icon: LucideIcon; // Updated to use LucideIcon instead of React.ElementType
}

interface Property {
  id: string;
  name?: string;
  address?: string;
  [key: string]: any; // For other potential properties
}

export default function CleaningChecklist() {
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [roomStats, setRoomStats] = useState<Record<string, RoomStat>>({});
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { id: "kitchen", name: "Kitchen", icon: Utensils },
    { id: "living_room", name: "Living Room", icon: Home },
    { id: "master_bedroom", name: "Master Bedroom", icon: Home },
    { id: "guest_bedroom", name: "Guest Bedroom", icon: Home },
    { id: "master_bathroom", name: "Master Bathroom", icon: Bath },
    { id: "guest_bathroom", name: "Guest Bathroom", icon: Bath },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const propertyData = await getMainProperty();
        setProperty(propertyData);

        if (propertyData?.id) {
          // Get task statistics for each room
          const { data: tasks, error } = await supabase
            .from("cleaning_tasks")
            .select("room, is_completed")
            .eq("property_id", propertyData.id);

          if (error) throw error;

          // Calculate stats for each room
          const stats: Record<string, RoomStat> = {};
          roomTypes.forEach((room) => {
            const roomTasks =
              tasks?.filter((task) => task.room === room.id) || [];
            stats[room.id] = {
              total: roomTasks.length,
              completed: roomTasks.filter((task) => task.is_completed).length,
            };
          });

          setRoomStats(stats);
        }
      } catch (error) {
        console.error("Error loading cleaning checklist data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [roomTypes]);

  useEffect(() => {
    async function loadCustomRooms() {
      if (!property?.id) return;

      try {
        const { data, error } = await supabase
          .from("cleaning_room_types")
          .select("slug, name, icon")
          .eq("property_id", property.id);

        if (error) throw error;

        if (data && data.length > 0) {
          // Add custom rooms to the room types
          const iconMap: Record<string, LucideIcon> = {
            home: Home,
            utensils: Utensils,
            bath: Bath,
            // Add any other icons you need
          };

          const customRooms: RoomType[] = data.map((room) => ({
            id: room.slug,
            name: room.name,
            icon: iconMap[room.icon] || Home, // Use the correct icon from the map
          }));

          setRoomTypes((prev) => [...prev, ...customRooms]);
        }
      } catch (error) {
        console.error("Error loading custom rooms:", error);
      }
    }

    loadCustomRooms();
  }, [property]);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/cleaning"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cleaning Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-6">Cleaning Checklist</h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomTypes.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                stats={roomStats[room.id] || { total: 0, completed: 0 }}
              />
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
