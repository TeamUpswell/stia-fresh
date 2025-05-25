"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import "@/styles/dashboard.css";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Package,
  Cloud,
  Wrench,
  Users,
  ChevronRight,
  Thermometer,
  Wind,
  Eye,
  Clock,
  Home,
  Wifi,
  Zap,
  Droplets,
  Shield,
  MapPin,
  Phone,
  Pencil,
  Plus,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import ResponsiveImage from "@/components/ResponsiveImage";
import { convertToWebP, supportsWebP } from "@/lib/imageUtils";

// Define interfaces for our new dashboard data
interface Issue {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "cleaning" | "inventory" | "safety";
  description: string;
  created_at: string;
  status: "open" | "in_progress" | "resolved";
}

interface UpcomingVisit {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  status: "confirmed" | "pending" | "cancelled";
  contact_info?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  category: "essentials" | "cleaning" | "amenities" | "maintenance";
  last_restocked: string;
  status: "good" | "low" | "critical";
}

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    wind_speed: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { currentProperty, properties, switchProperty } = useProperty();

  // State for dashboard content
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Issue[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch upcoming visits/reservations
  useEffect(() => {
    async function fetchUpcomingVisits() {
      if (!currentProperty) return;

      try {
        const today = new Date().toISOString().split("T")[0];
        const { data: visits, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("property_id", currentProperty.id)
          .gte("start_date", today) // ✅ Fixed: was "check_in"
          .order("start_date", { ascending: true }) // ✅ Fixed: was "check_in"
          .limit(5);

        if (error) throw error;

        setUpcomingVisits(
          visits?.map((v) => ({
            id: v.id,
            guest_name: v.title || v.guest_name, // ✅ Fixed: title is primary
            check_in: v.start_date, // ✅ Fixed: use start_date
            check_out: v.end_date, // ✅ Fixed: use end_date
            guests_count: v.guests || 1,
            status: v.status || "pending",
            contact_info: v.contact_email || v.contact_phone,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching upcoming visits:", error);
      }
    }

    fetchUpcomingVisits();
  }, [currentProperty]);

  // Fetch inventory alerts
  useEffect(() => {
    async function fetchInventoryAlerts() {
      if (!currentProperty) return;

      try {
        const { data: inventory, error } = await supabase
          .from("inventory")
          .select("*")
          .eq("property_id", currentProperty.id)
          .or("quantity.lte.threshold") // ✅ Fixed: was "current_stock.lte.min_stock"
          .order("category");

        if (error) throw error;

        const alerts =
          inventory
            ?.map((item) => ({
              ...item,
              current_stock: item.quantity, // ✅ Map for interface compatibility
              min_stock: item.threshold, // ✅ Map for interface compatibility
              status:
                item.quantity <= 0 // ✅ Fixed: was current_stock
                  ? ("critical" as const)
                  : item.quantity <= item.threshold // ✅ Fixed: was current_stock/min_stock
                  ? ("low" as const)
                  : ("good" as const),
            }))
            .filter((item) => item.status !== "good") || [];

        setInventoryAlerts(alerts);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        // Create some example data if table doesn't exist
        setInventoryAlerts([
          {
            id: "1",
            name: "Toilet Paper",
            current_stock: 2,
            min_stock: 6,
            category: "essentials",
            last_restocked: "2024-01-15",
            status: "low",
          },
          {
            id: "2",
            name: "Coffee",
            current_stock: 0,
            min_stock: 2,
            category: "amenities",
            last_restocked: "2024-01-10",
            status: "critical",
          },
        ]);
      }
    }

    fetchInventoryAlerts();
  }, [currentProperty]);

  // Fetch maintenance alerts
  useEffect(() => {
    async function fetchMaintenanceAlerts() {
      if (!currentProperty) return;

      try {
        const { data: issues, error } = await supabase
          .from("cleaning_issues") // ✅ Fixed: was "property_issues"
          .select("*")
          .eq("property_id", currentProperty.id)
          .eq("status", "open")
          .eq("category", "maintenance") // Add this filter if needed
          .order("severity", { ascending: false });

        if (error) throw error;
        setMaintenanceAlerts(issues || []);
      } catch (error) {
        console.error("Error fetching maintenance alerts:", error);
      }
    }

    fetchMaintenanceAlerts();
  }, [currentProperty]);

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      if (!currentProperty?.latitude || !currentProperty?.longitude) {
        // Show fallback weather for now
        setWeather({
          current: {
            temp: 72,
            condition: "Partly cloudy",
            humidity: 65,
            wind_speed: 8,
            icon: "02d",
          },
          forecast: [
            {
              date: "2024-05-25",
              high: 75,
              low: 60,
              condition: "Sunny",
              icon: "01d",
            },
            {
              date: "2024-05-26",
              high: 73,
              low: 58,
              condition: "Cloudy",
              icon: "03d",
            },
            {
              date: "2024-05-27",
              high: 68,
              low: 55,
              condition: "Rain",
              icon: "10d",
            },
          ],
        });
        return;
      }

      try {
        const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

        if (!API_KEY) {
          console.log("Weather API key not configured");
          return;
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentProperty.latitude}&lon=${currentProperty.longitude}&appid=${API_KEY}&units=imperial`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();

          setWeather({
            current: {
              temp: Math.round(data.list[0].main.temp),
              condition: data.list[0].weather[0].description,
              humidity: data.list[0].main.humidity,
              wind_speed: Math.round(data.list[0].wind.speed),
              icon: data.list[0].weather[0].icon,
            },
            forecast: data.list.slice(1, 6).map((item: any) => ({
              date: item.dt_txt.split(" ")[0],
              high: Math.round(item.main.temp_max),
              low: Math.round(item.main.temp_min),
              condition: item.weather[0].description,
              icon: item.weather[0].icon,
            })),
          });
        } else {
          console.error("Weather API error:", response.status);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    }

    fetchWeather();
  }, [currentProperty]);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProperty) {
      toast.error("Please select a property first");
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload = file;
      let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const webpSupported = await supportsWebP();
      if (webpSupported) {
        const optimizedBlob = await convertToWebP(file, 1920, 0.85);
        fileToUpload = new File([optimizedBlob], `property.webp`, {
          type: "image/webp",
        });
        fileExt = "webp";
      }

      const fileName = `property-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, fileToUpload, {
          cacheControl: "31536000",
          upsert: true,
        });

      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("properties")
        .update({ main_photo_url: publicUrlData.publicUrl })
        .eq("id", currentProperty.id);

      if (updateError) throw updateError;

      toast.success("Property image updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
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

  if (!currentProperty) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-8 text-center">
          <div className="max-w-md mx-auto">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Property Selected
            </h2>
            <p className="text-gray-600 mb-6">
              Please select a property from the dropdown to view your dashboard.
            </p>
            <Link
              href="/properties/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Property Hero Header with Weather Overlay */}
        <div className="relative rounded-xl overflow-hidden h-64 mb-8 group">
          {currentProperty?.main_photo_url ? (
            <div className="relative w-full h-full">
              <ResponsiveImage
                src={currentProperty.main_photo_url}
                alt={currentProperty.name || "Property"}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={true}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <p className="text-white text-lg">Add a property image</p>
            </div>
          )}

          {/* Weather Widget Overlay - Lower Right Corner */}
          {weather && (
            <div className="absolute bottom-4 right-4 z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 min-w-80">
                <div className="flex items-center justify-between">
                  {/* Current Weather */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      {weather.current.icon ? (
                        <img
                          src={`https://openweathermap.org/img/wn/${weather.current.icon}.png`}
                          alt={weather.current.condition}
                          className="w-8 h-8"
                        />
                      ) : (
                        <Cloud className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {weather.current.temp}°F
                      </div>
                      <p
                        className="text-sm capitalize font-black"
                        style={{ color: "#000000" }}
                      >
                        {weather.current.condition}
                      </p>
                    </div>
                  </div>

                  {/* Mini Forecast */}
                  <div className="flex items-center space-x-2">
                    {weather.forecast.slice(0, 3).map((day, index) => {
                      const date = new Date(day.date);
                      const dayName = date
                        .toLocaleDateString("en-US", { weekday: "short" })
                        .slice(0, 2);

                      return (
                        <div key={index} className="text-center">
                          <div className="text-xs text-gray-900 font-bold">
                            {dayName}
                          </div>
                          <div className="w-6 h-6 mx-auto my-1">
                            {day.icon ? (
                              <img
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                                alt={day.condition}
                                className="w-6 h-6"
                              />
                            ) : (
                              <Cloud className="h-4 w-4 text-gray-800" />
                            )}
                          </div>
                          <div className="text-xs text-gray-900 font-bold">
                            {day.high}°
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weather Stats */}
                  <div className="text-right space-y-1">
                    <div className="flex items-center text-xs text-gray-900">
                      <Droplets className="h-3 w-3 mr-1 text-blue-600" />
                      <span className="font-bold">
                        {weather.current.humidity}%
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-900">
                      <Wind className="h-3 w-3 mr-1 text-gray-800" />
                      <span className="font-bold">
                        {weather.current.wind_speed} mph
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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

          {/* Upload Progress */}
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

          {/* Property Info Overlay - Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {currentProperty?.name || "My Property"}
              </h1>
              {currentProperty?.address && (
                <p className="text-white/90 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {currentProperty.address}
                  {currentProperty.city && currentProperty.state && (
                    <span>
                      , {currentProperty.city}, {currentProperty.state}{" "}
                      {currentProperty.zip}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Dashboard Grid (Weather removed from here) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1 - Upcoming Visits */}
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center text-gray-900">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  Upcoming Visits
                </h2>
                <Link
                  href="/calendar"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Calendar
                </Link>
              </div>

              {upcomingVisits.length > 0 ? (
                <div className="space-y-3">
                  {upcomingVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {visit.guest_name}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {new Date(visit.check_in).toLocaleDateString()} -{" "}
                            {new Date(visit.check_out).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {visit.guests_count} guest
                            {visit.guests_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            visit.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : visit.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {visit.status}
                        </span>
                        {visit.contact_info && (
                          <p className="text-xs text-gray-600 mt-1">
                            {visit.contact_info}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-700">No upcoming visits scheduled</p>
                  <Link
                    href="/reservations/new"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block font-medium"
                  >
                    Add a reservation
                  </Link>
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/issues/new"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Report Issue
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/reservations/new"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Add Reservation
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/inventory/add"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-5 w-5 text-green-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Update Inventory
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
                <Link
                  href="/maintenance/schedule"
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Wrench className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium text-gray-900">
                    Schedule Maintenance
                  </span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
              </div>
            </section>
          </div>

          {/* Column 2 - Inventory & Maintenance */}
          <div className="space-y-6">
            {/* Inventory Alerts */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center text-gray-900">
                  <Package className="h-6 w-6 text-green-600 mr-2" />
                  Inventory Status
                </h2>
                <Link
                  href="/inventory"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </Link>
              </div>

              {inventoryAlerts.length > 0 ? (
                <div className="space-y-3">
                  {inventoryAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        item.status === "critical"
                          ? "border-l-red-400 bg-red-50"
                          : "border-l-yellow-400 bg-yellow-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4
                            className={`font-medium ${
                              item.status === "critical"
                                ? "text-red-900"
                                : "text-yellow-900"
                            }`}
                          >
                            {item.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              item.status === "critical"
                                ? "text-red-800"
                                : "text-yellow-800"
                            }`}
                          >
                            {item.current_stock} / {item.min_stock} minimum
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === "critical"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/inventory/restock"
                    className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                    style={{ color: "#ffffff" }}
                  >
                    Create Shopping List
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-700">
                    All essentials are well stocked!
                  </p>
                  <Link
                    href="/inventory"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block font-medium"
                  >
                    Manage inventory
                  </Link>
                </div>
              )}
            </section>

            {/* Maintenance Alerts */}
            {maintenanceAlerts.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center text-gray-900">
                    <Wrench className="h-6 w-6 text-orange-600 mr-2" />
                    Maintenance Alerts
                  </h2>
                  <Link
                    href="/maintenance"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {maintenanceAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border-l-4 border-l-orange-400 bg-orange-50"
                    >
                      <div>
                        <h4 className="font-medium text-orange-900">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-orange-800">
                          {alert.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : alert.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
