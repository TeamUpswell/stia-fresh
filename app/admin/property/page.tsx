"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Tab } from "@headlessui/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useTenant } from "@/lib/hooks/useTenant"; // Add this import
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import PermissionGate from "@/components/PermissionGate";
import { toast } from "react-hot-toast";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Check,
  X,
  Upload,
  Plus,
  Save,
  Wifi,
  Car,
  Shield,
  Info,
} from "lucide-react";
import GoogleAddressAutocomplete from "@/components/GoogleAddressAutocomplete";

// Define property type for form data
interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  description: string;
  // Location data
  latitude: number | null;
  longitude: number | null;
  neighborhood_description: string;
  // Property details
  wifi_name: string;
  wifi_password: string;
  check_in_instructions: string;
  check_out_instructions: string;
  house_rules: string;
  security_info: string;
  parking_info: string;
  // Amenities (stored as array or JSON)
  amenities: string[];
  // Add this line to include main_photo_url
  main_photo_url?: string;
}

export default function PropertySettings() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  // ✅ Add this debug effect
  useEffect(() => {
    async function debugUserRole() {
      if (!user) return;

      console.log("Current user:", user);

      // Check user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      console.log("User roles query result:", roleData, roleError);

      // Check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

      console.log("User profile:", profileData, profileError);
    }

    debugUserRole();
  }, [user]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [property, setProperty] = useState<any>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // Add section-specific saving states
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>();

  // Debug current form values
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log("Form value changed:", name, value);
    });
    return () => subscription.unsubscribe();
  }, []); // Remove watch from dependencies

  // Property types for dropdown
  const propertyTypes = [
    "House",
    "Apartment",
    "Condo",
    "Cabin",
    "Villa",
    "Townhouse",
    "Other",
  ];

  // Common amenities for checkbox selection
  const commonAmenities = [
    "Wi-Fi",
    "Kitchen",
    "Washer",
    "Dryer",
    "Air conditioning",
    "Heating",
    "TV",
    "Pool",
    "Hot tub",
    "Patio",
    "BBQ grill",
    "Fireplace",
    "Cable TV",
    "Free parking",
    "Gym",
    "Workspace",
    "Smoke detector",
    "First aid kit",
  ];

  // Fetch property data
  useEffect(() => {
    async function fetchPropertyData() {
      try {
        let propertyData;

        // If propertyId is provided, use that, otherwise get main property
        if (propertyId) {
          propertyData = await loadProperty(propertyId);
        } else {
          // First try to get any existing property
          const { data, error } = await supabase
            .from("properties")
            .select("*")
            .limit(1)
            .single();

          if (data) {
            propertyData = data;
            setPropertyId(data.id);
          } else {
            // No property exists yet, prepare for creating a new one
            setIsLoading(false);
            return; // Don't try to reset form with non-existent data
          }
        }

        if (propertyData) {
          console.log("Property data loaded:", propertyData);
          setProperty(propertyData);

          // Convert any null or undefined amenities to empty array
          if (!propertyData.amenities) {
            propertyData.amenities = [];
          }

          // Reset form with property data
          reset(propertyData);
          toast.success("Property data loaded successfully");
        }
      } catch (error) {
        console.error("Error loading property:", error);
        toast.error("Failed to load property data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPropertyData();
  }, [propertyId, reset]);

  // Add this to your component for debugging
  useEffect(() => {
    // Debug function to check for duplicate properties
    async function checkForDuplicateProperties() {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("id, name, created_at");

        if (error) {
          console.error("Error checking properties:", error);
          return;
        }

        if (data && data.length > 1) {
          console.warn("Multiple properties found:", data);
          // Optional: Add a warning notification for admins
        } else if (data && data.length === 1) {
          console.log("Single property record confirmed:", data[0].id);
        } else {
          console.log(
            "No properties found - first one will be created on save"
          );
        }
      } catch (err) {
        console.error("Error in duplicate check:", err);
      }
    }

    // Only run in development
    if (process.env.NODE_ENV === "development") {
      checkForDuplicateProperties();
    }
  }, []);

  // Add this debug function somewhere in your component
  const debugPropertyDetails = async () => {
    if (!property?.id) return;

    const { data, error } = await supabase
      .from("property_details")
      .select("*")
      .eq("property_id", property.id);

    console.log("Current property_details:", data, error);
  };

  // Call it when loading the form
  useEffect(() => {
    if (property?.id) {
      debugPropertyDetails();
    }
  }, [property?.id]);

  // Add this near your other debug functions
  const testDatabaseOperation = async () => {
    if (!property?.id) {
      console.error("No property ID available");
      return;
    }

    try {
      // 1. Check if the property exists
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", property.id)
        .single();

      console.log("Property check:", propertyData, propertyError);

      // 2. Check if property_details exists
      const { data: detailsData, error: detailsError } = await supabase
        .from("property_details")
        .select("*")
        .eq("property_id", property.id);

      console.log("Property details check:", detailsData, detailsError);

      // 3. Attempt a manual insert/update
      const testData = {
        property_id: property.id,
        bedrooms: 2,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (detailsData && detailsData.length > 0) {
        // Update existing
        result = await supabase
          .from("property_details")
          .update(testData)
          .eq("property_id", property.id);
      } else {
        // Create new
        result = await supabase.from("property_details").insert([testData]);
      }

      console.log("Test operation result:", result);

      return { success: !result.error, error: result.error };
    } catch (error) {
      console.error("Test database operation failed:", error);
      return { success: false, error };
    }
  };

  // Add this debug function to verify user authentication
  const checkUserAuth = () => {
    console.log("Current user:", user);
    console.log("Auth state:", supabase.auth.getSession());
  };

  // Replace loadProperty function with this:
  const loadProperty = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setProperty(data);
      reset(data);

      console.log("Loaded property data:", data);
      return data;
    } catch (error) {
      console.error("Error loading property:", error);
      return null;
    }
  };

  // Replace onSubmit function with this simplified version:
  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Create a single data object with all fields
      const propertyData = {
        name: data.name,
        address: data.address,
        description: data.description,
        property_type: data.property_type,
        bedrooms: Number(data.bedrooms) || 0,
        bathrooms: Number(data.bathrooms) || 0,
        max_occupancy: Number(data.max_occupancy) || 1,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        latitude: data.latitude ? parseFloat(String(data.latitude)) : null,
        longitude: data.longitude ? parseFloat(String(data.longitude)) : null,
        wifi_name: data.wifi_name,
        wifi_password: data.wifi_password,
        check_in_instructions: data.check_in_instructions,
        check_out_instructions: data.check_out_instructions,
        house_rules: data.house_rules,
        security_info: data.security_info,
        parking_info: data.parking_info,
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        neighborhood_description: data.neighborhood_description,
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      let result;

      if (property?.id) {
        // Update existing property
        result = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", property.id)
          .select();
      } else {
        // Create new property
        result = await supabase
          .from("properties")
          .insert([
            {
              ...propertyData,
              created_at: new Date().toISOString(),
              created_by: user.id,
            },
          ])
          .select();
      }

      if (result.error) throw result.error;

      if (result.data?.[0]) {
        setProperty(result.data[0]);
        setPropertyId(result.data[0].id);
        toast.success("Property settings saved successfully");
      }
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast.error(error.message || "Failed to save property settings");
    } finally {
      setIsSaving(false);
    }
  };

  const saveBasicInfo = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      setIsSavingBasic(true);

      const basicData = {
        name: watch("name") || "New Property",
        address: watch("address") || null,
        description: watch("description") || null,
        property_type: watch("property_type"),
        bedrooms: Number(watch("bedrooms")) || 0,
        bathrooms: Number(watch("bathrooms")) || 0,
        max_occupancy: Number(watch("max_occupancy")) || 1,
        city: watch("city"),
        state: watch("state"),
        zip: watch("zip"),
        country: watch("country"),
        updated_at: new Date().toISOString(),
      };

      // Same logic for insert or update, but no separate property_details operations
      // ...
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSomeFunction = async () => {
    try {
      // Your code here...
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Any cleanup
    }
  };

  // Tab classnames helper
  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <AuthenticatedLayout>
      <PermissionGate
        requiredRole={["owner", "manager"]} // ✅ Array format
        fallback={
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600">
              Property settings are restricted to property owners and managers
              only.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact the property owner if you need to make changes.
            </p>
          </div>
        }
      >
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Property Settings</h1>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)} // This ensures proper form validation
              disabled={isSaving}
              className={`
                flex items-center px-4 py-2 rounded-md shadow-sm
                ${isSaving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
                text-white font-medium text-sm
              `}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </span>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form>
              <Tab.Group
                selectedIndex={selectedTabIndex}
                onChange={setSelectedTabIndex}
              >
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-600 p-1 mb-8">
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                        "ring-white ring-opacity-60 focus:outline-none transition-all",
                        selected
                          ? "bg-white text-blue-700 shadow"
                          : "text-white hover:bg-blue-700/80"
                      )
                    }
                  >
                    <div className="flex items-center justify-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      Basic Info
                    </div>
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                        "ring-white ring-opacity-60 focus:outline-none transition-all",
                        selected
                          ? "bg-white text-blue-700 shadow"
                          : "text-white hover:bg-blue-700/80"
                      )
                    }
                  >
                    <div className="flex items-center justify-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Visual Assets
                    </div>
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                        "ring-white ring-opacity-60 focus:outline-none transition-all",
                        selected
                          ? "bg-white text-blue-700 shadow"
                          : "text-white hover:bg-blue-700/80"
                      )
                    }
                  >
                    <div className="flex items-center justify-center">
                      <Info className="h-4 w-4 mr-2" />
                      Property Details
                    </div>
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                        "ring-white ring-opacity-60 focus:outline-none transition-all",
                        selected
                          ? "bg-white text-blue-700 shadow"
                          : "text-white hover:bg-blue-700/80"
                      )
                    }
                  >
                    <div className="flex items-center justify-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </div>
                  </Tab>
                </Tab.List>

                <Tab.Panels className="mt-2">
                  {/* Basic Property Information */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Name
                        </label>
                        <input
                          type="text"
                          {...register("name", {
                            required: "Property name is required",
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Type
                        </label>
                        <select
                          {...register("property_type")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select property type...</option>
                          {propertyTypes.map((type) => (
                            <option key={type} value={type.toLowerCase()}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bedrooms
                          </label>
                          <input
                            type="number"
                            {...register("bedrooms", { min: 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bathrooms
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            {...register("bathrooms", { min: 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Occupancy
                          </label>
                          <input
                            type="number"
                            {...register("max_occupancy", { min: 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Find Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <GoogleAddressAutocomplete
                            placeholder="Search for your property address..."
                            onAddressSelect={(address) => {
                              // Update the form fields with selected address data
                              setValue("address", address.street);
                              setValue("city", address.city);
                              setValue("state", address.state);
                              setValue("zip", address.zip);
                              setValue("country", address.country);
                              setValue("latitude", address.latitude);
                              setValue("longitude", address.longitude);
                              toast.success("Address filled automatically");
                            }}
                            className="pl-10 w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <p className="mt-1 mb-2 text-sm text-gray-500">
                          Search for your address to auto-fill fields, or enter
                          manually below
                        </p>

                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          {...register("address")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          {...register("city")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State/Province
                          </label>
                          <input
                            type="text"
                            {...register("state")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP/Postal Code
                          </label>
                          <input
                            type="text"
                            {...register("zip")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          {...register("country")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          {...register("description")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Short description of your property..."
                        ></textarea>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={saveBasicInfo}
                        disabled={isSavingBasic}
                        className={`
                          flex items-center px-4 py-2 rounded-md shadow-sm
                          ${
                            isSavingBasic
                              ? "bg-gray-400"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                          text-white font-medium text-sm
                        `}
                      >
                        {isSavingBasic ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Save Basic Info
                          </span>
                        )}
                      </button>
                    </div>
                  </Tab.Panel>

                  {/* Visual Assets */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Main Photo
                        </label>
                        <div className="flex items-center space-x-4">
                          {property?.main_photo_url && (
                            <Image
                              src={property.main_photo_url}
                              alt="Main Photo"
                              width={100}
                              height={100}
                              className="rounded-md"
                            />
                          )}
                          <input
                            id="property-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            aria-label="Upload property image"
                          />
                        </div>
                        {isUploading && (
                          <div className="mt-2 text-sm text-gray-500">
                            Uploading... {uploadProgress}%
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Property Details */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wi-Fi Name
                        </label>
                        <input
                          type="text"
                          {...register("wifi_name")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wi-Fi Password
                        </label>
                        <input
                          type="text"
                          {...register("wifi_password")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-in Instructions
                        </label>
                        <textarea
                          {...register("check_in_instructions")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Provide check-in instructions..."
                        ></textarea>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check-out Instructions
                        </label>
                        <textarea
                          {...register("check_out_instructions")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Provide check-out instructions..."
                        ></textarea>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          House Rules
                        </label>
                        <textarea
                          {...register("house_rules")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Provide house rules..."
                        ></textarea>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Security Information
                        </label>
                        <textarea
                          {...register("security_info")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Provide security information..."
                        ></textarea>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parking Information
                        </label>
                        <textarea
                          {...register("parking_info")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Provide parking information..."
                        ></textarea>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amenities
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {commonAmenities.map((amenity) => (
                            <div key={amenity} className="flex items-center">
                              <input
                                id={`amenity-${amenity
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                type="checkbox"
                                value={amenity}
                                {...register("amenities")}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={amenity}
                              />
                              <label
                                htmlFor={`amenity-${amenity
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                {amenity}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSavingDetails}
                        className={`
                          flex items-center px-4 py-2 rounded-md shadow-sm
                          ${
                            isSavingDetails
                              ? "bg-gray-400"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                          text-white font-medium text-sm
                        `}
                      >
                        {isSavingDetails ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Save Property Details
                          </span>
                        )}
                      </button>
                    </div>
                  </Tab.Panel>

                  {/* Location */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="text"
                          {...register("latitude")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="text"
                          {...register("longitude")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Neighborhood Description
                        </label>
                        <textarea
                          {...register("neighborhood_description")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe the neighborhood..."
                        ></textarea>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSavingLocation}
                        className={`
                          flex items-center px-4 py-2 rounded-md shadow-sm
                          ${
                            isSavingLocation
                              ? "bg-gray-400"
                              : "bg-blue-600 hover:bg-blue-700"
                          }
                          text-white font-medium text-sm
                        `}
                      >
                        {isSavingLocation ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Save Location
                          </span>
                        )}
                      </button>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </form>
          )}
        </div>
      </PermissionGate>
    </AuthenticatedLayout>
  );
}
