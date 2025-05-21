"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Tab } from "@headlessui/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
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
import { getPropertyById, updateProperty } from "@/lib/propertyService";
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
  }, [watch]);

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
    async function loadProperty() {
      try {
        let propertyData;

        // If propertyId is provided, use that, otherwise get main property
        if (propertyId) {
          propertyData = await getPropertyById(propertyId);
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

    loadProperty();
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
        result = await supabase
          .from("property_details")
          .insert([testData]);
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

  // Update the onSubmit function

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // 1. Save basic property data first (name, address, description)
      const basicData = {
        name: data.name,
        address: data.address,
        description: data.description,
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      console.log("Saving basic data:", basicData);

      let propertyRecord;

      if (property?.id) {
        // Update existing property
        const { data: updatedData, error } = await supabase
          .from("properties")
          .update(basicData)
          .eq("id", property.id)
          .select();

        if (error) throw error;
        propertyRecord = updatedData?.[0];
      } else {
        // Create new property
        const { data: newData, error } = await supabase
          .from("properties")
          .insert([{ ...basicData, created_at: new Date().toISOString() }])
          .select();

        if (error) throw error;
        propertyRecord = newData?.[0];

        if (propertyRecord) {
          setPropertyId(propertyRecord.id);
          setProperty(propertyRecord);
        }
      }

      if (!propertyRecord?.id) {
        throw new Error("Failed to save basic property data");
      }

      // 2. Save extended property data
      const extendedSaved = await saveExtendedPropertyInfo(propertyRecord.id);

      if (extendedSaved) {
        toast.success("All property settings saved successfully");
      } else {
        toast.error("Basic property info saved, but some details failed to save", {
          style: {
            background: '#FEF3C7', // Light amber color
            color: '#92400E',      // Dark amber color
            border: '1px solid #F59E0B',
          },
        });
      }

      // 3. Fetch complete updated property data
      await loadProperty(propertyRecord.id);
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast.error(error.message || "Failed to save property settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Add this helper function to reload property data
  const loadProperty = async (id: string) => {
    try {
      const { data: basicData, error: basicError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (basicError) throw basicError;

      // Also fetch extended data if you have that table
      const { data: extendedData, error: extendedError } = await supabase
        .from("property_details")
        .select("*")
        .eq("property_id", id)
        .single();

      // Combine the data
      const combinedData = {
        ...basicData,
        ...(extendedData || {}),
      };

      setProperty(combinedData);
      reset(combinedData);

      console.log("Loaded complete property data:", combinedData);
      return combinedData;
    } catch (error) {
      console.error("Error loading property:", error);
      return null;
    }
  };

  const saveExtendedPropertyInfo = async (propertyId: string) => {
    if (!propertyId) return;

    try {
      // First check if an extended record already exists
      const { data: existingData, error: checkError } = await supabase
        .from("property_details") // Create this table in Supabase
        .select("*")
        .eq("property_id", propertyId)
        .single();

      const extendedData = {
        property_id: propertyId,
        property_type: watch("property_type"),
        bedrooms: Number(watch("bedrooms")) || 0,
        bathrooms: Number(watch("bathrooms")) || 0,
        max_occupancy: Number(watch("max_occupancy")) || 1,
        city: watch("city"),
        state: watch("state"),
        zip: watch("zip"),
        country: watch("country"),
        latitude: watch("latitude") ? parseFloat(String(watch("latitude"))) : null,
        longitude: watch("longitude") ? parseFloat(String(watch("longitude"))) : null,
        wifi_name: watch("wifi_name"),
        wifi_password: watch("wifi_password"),
        check_in_instructions: watch("check_in_instructions"),
        check_out_instructions: watch("check_out_instructions"),
        house_rules: watch("house_rules"),
        security_info: watch("security_info"),
        parking_info: watch("parking_info"),
        amenities: Array.isArray(watch("amenities")) ? watch("amenities") : [],
        neighborhood_description: watch("neighborhood_description"),
        updated_at: new Date().toISOString(),
      };

      console.log("Extended data to save:", extendedData);

      let result;

      if (existingData) {
        // Update
        result = await supabase
          .from("property_details")
          .update(extendedData)
          .eq("property_id", propertyId)
          .select();
      } else {
        // Insert
        result = await supabase
          .from("property_details")
          .insert([extendedData])
          .select();
      }

      if (result.error) {
        console.error("Error saving extended property info:", result.error);
        return false;
      }

      console.log("Extended property info saved:", result.data);
      return true;
    } catch (error) {
      console.error("Error in saveExtendedPropertyInfo:", error);
      return false;
    }
  };

  // Save Basic Info section
  const saveBasicInfo = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Create new property if it doesn't exist yet
    if (!property?.id) {
      // Create new property with only the fields in your schema
      const basicData = {
        name: watch("name") || "New Property",
        address: watch("address") || null,
        description: watch("description") || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      try {
        console.log("Creating new property with data:", basicData);

        const { data, error } = await supabase
          .from("properties")
          .insert([basicData])
          .select();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        if (data && data[0]) {
          console.log("New property created successfully:", data[0]);
          setProperty(data[0]);
          setPropertyId(data[0].id);
          toast.success("New property created!");

          // Now immediately create a record in property_details
          const initialDetails = {
            property_id: data[0].id,
            property_type: watch("property_type"),
            bedrooms: Number(watch("bedrooms")) || 0,
            bathrooms: Number(watch("bathrooms")) || 0,
            max_occupancy: Number(watch("max_occupancy")) || 1,
            city: watch("city"),
            state: watch("state"),
            zip: watch("zip"),
            country: watch("country"),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: detailsError } = await supabase
            .from("property_details")
            .insert([initialDetails]);

          if (detailsError) {
            console.warn(
              "Could not create initial property details:",
              detailsError
            );
          }
        }

        return;
      } catch (err) {
        console.error("Error creating property:", err);
        toast.error("Failed to create property");
        return;
      }
    }

    // Update existing property basic info
    try {
      setIsSavingBasic(true);

      // Only include fields that exist in your schema
      const basicInfoData = {
        name: watch("name"),
        address: watch("address"),
        description: watch("description"),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      console.log("Updating property with data:", basicInfoData);

      const { data, error } = await supabase
        .from("properties")
        .update(basicInfoData)
        .eq("id", property.id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      // Also update the property_details table with the basic fields there
      const { data: existingDetails } = await supabase
        .from("property_details")
        .select("*")
        .eq("property_id", property.id)
        .single();

      const detailsData = {
        property_id: property.id,
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

      if (existingDetails) {
        await supabase
          .from("property_details")
          .update(detailsData)
          .eq("property_id", property.id);
      } else {
        await supabase.from("property_details").insert([detailsData]);
      }

      console.log("Supabase update response:", data);

      if (data && data[0]) {
        setProperty({ ...property, ...data[0] });
        toast.success("Basic property info saved");
      }
    } catch (error) {
      console.error("Error saving basic info:", error);
      toast.error("Failed to save basic info");
    } finally {
      setIsSavingBasic(false);
    }
  };

  // Fix the savePropertyDetails function
  const savePropertyDetails = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !property?.id) {
      toast.error("Please save basic info first");
      return;
    }

    try {
      setIsSavingDetails(true);

      // Check if property_details record exists
      const { data: existingData, error: checkError } = await supabase
        .from("property_details")
        .select("*")
        .eq("property_id", property.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking for existing details:", checkError);
      }

      // Prepare the data for property_details
      const detailsData = {
        property_id: property.id, // Make sure this is included
        property_type: watch("property_type"),
        bedrooms: Number(watch("bedrooms")) || 0,
        bathrooms: Number(watch("bathrooms")) || 0,
        max_occupancy: Number(watch("max_occupancy")) || 1,
        wifi_name: watch("wifi_name"),
        wifi_password: watch("wifi_password"),
        check_in_instructions: watch("check_in_instructions"),
        check_out_instructions: watch("check_out_instructions"),
        house_rules: watch("house_rules"),
        security_info: watch("security_info"),
        parking_info: watch("parking_info"),
        amenities: Array.isArray(watch("amenities")) ? watch("amenities") : [],
        updated_at: new Date().toISOString(),
      };

      console.log("Saving property details:", detailsData);
      console.log("Property ID:", property.id);

      let result;

      if (existingData) {
        console.log("Updating existing property details");
        // Update existing record
        result = await supabase
          .from("property_details")
          .update(detailsData)
          .eq("property_id", property.id);
      } else {
        console.log("Creating new property details");
        // Create new record - NOW WITH PROPER DATA
        result = await supabase
          .from("property_details")
          .insert([detailsData]);
      }

      if (result.error) {
        console.error("Database error:", result.error);
        throw result.error;
      }

      toast.success("Property details saved successfully");

      // Refresh property data to show saved changes
      await loadProperty(property.id);
    } catch (error: any) {
      console.error("Error saving property details:", error);
      toast.error(error.message || "Failed to save property details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save Location section
  const saveLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !property?.id) {
      toast.error("Please save basic info first");
      return;
    }

    try {
      setIsSavingLocation(true);

      // Check if property_details record exists
      const { data: existingData } = await supabase
        .from("property_details")
        .select("*")
        .eq("property_id", property.id)
        .single();

      // First, save coordinates to properties table (these should be in main table too)
      const mainLocationData = {
        latitude: watch("latitude") ? parseFloat(String(watch("latitude"))) : null,
        longitude: watch("longitude") ? parseFloat(String(watch("longitude"))) : null,
        updated_at: new Date().toISOString(),
      };

      // Update the main properties table with basic coordinates
      await supabase
        .from("properties")
        .update(mainLocationData)
        .eq("id", property.id);

      // Then save ALL location data to property_details
      const locationData = {
        property_id: property.id,
        latitude: watch("latitude") ? parseFloat(String(watch("latitude"))) : null,
        longitude: watch("longitude") ? parseFloat(String(watch("longitude"))) : null,
        city: watch("city"),
        state: watch("state"),
        zip: watch("zip"),
        country: watch("country"),
        neighborhood_description: watch("neighborhood_description"),
        updated_at: new Date().toISOString(),
      };

      console.log("Saving location data to property_details:", locationData);

      let result;

      if (existingData) {
        // Update existing record
        result = await supabase
          .from("property_details")
          .update(locationData)
          .eq("property_id", property.id);
      } else {
        // Create new record
        result = await supabase
          .from("property_details")
          .insert([locationData]);
      }

      if (result.error) throw result.error;

      toast.success("Location information saved");
    } catch (error: any) {
      console.error("Error saving location info:", error);
      toast.error(error.message || "Failed to save location info");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Handle main photo upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/i)) {
      toast.error("Please select a valid image file (JPEG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("Image must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `property-${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      // Set up a progress tracker using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      // Upload to Supabase Storage using standard options
      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, file, {
          cacheControl: "31536000", // 1 year for static images
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("properties").getPublicUrl(filePath);

      if (!property?.id) {
        toast.error("Please save basic property information first");
        return;
      }

      // Update property record
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

      // Now this will work because we added main_photo_url to the interface
      setValue("main_photo_url", publicUrl);
      toast.success("Property image updated!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
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
        requiredRole="manager"
        fallback={
          <div className="p-8 text-center">
            Access restricted to property managers and owners.
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
                          Property Address
                        </label>
                        <GoogleAddressAutocomplete
                          placeholder="Start typing to search for addresses..."
                          onAddressSelect={(address) => {
                            // Update the form fields with selected address data
                            setValue("address", address.street);
                            setValue("city", address.city);
                            setValue("state", address.state);
                            setValue("zip", address.zip);
                            setValue("country", address.country);

                            // Also update location coordinates if available
                            setValue("latitude", address.latitude);
                            setValue("longitude", address.longitude);

                            // If you want to show a notification
                            toast.success("Address filled automatically");
                          }}
                        />
                        {/* Keep the original address input for manual editing */}
                        <input
                          type="text"
                          {...register("address")}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={handleImageUpload}
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
                        onClick={savePropertyDetails}
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
                        onClick={saveLocation}
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
              <div className="mt-4">
                <button
                  type="button"
                  onClick={testDatabaseOperation}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm"
                >
                  Debug DB
                </button>
              </div>
            </form>
          )}
        </div>
      </PermissionGate>
    </AuthenticatedLayout>
  );
}
