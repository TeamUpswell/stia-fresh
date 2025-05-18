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
  Building2, MapPin, Check, X, Upload, Plus, Save,
  Wifi, Car, Shield, Info
} from "lucide-react";

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
}

export default function PropertySettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [property, setProperty] = useState<any>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
  // React Hook Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PropertyFormData>();

  // Property types for dropdown
  const propertyTypes = [
    "House", "Apartment", "Condo", "Cabin", "Villa", "Townhouse", "Other"
  ];
  
  // Common amenities for checkbox selection
  const commonAmenities = [
    "Wi-Fi", "Kitchen", "Washer", "Dryer", "Air conditioning", "Heating",
    "TV", "Pool", "Hot tub", "Patio", "BBQ grill", "Fireplace", "Cable TV",
    "Free parking", "Gym", "Workspace", "Smoke detector", "First aid kit"
  ];

  // Fetch property data
  useEffect(() => {
    async function fetchPropertyData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Try to get existing property
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .single();
          
        if (error && error.code !== "PGRST116") {
          console.error("Error fetching property:", error);
          toast.error("Failed to load property data");
          return;
        }
        
        if (data) {
          setProperty(data);
          
          // Populate form with existing data
          Object.entries(data).forEach(([key, value]) => {
            // Handle amenities array if needed
            if (key === "amenities" && Array.isArray(value)) {
              setValue(key as keyof PropertyFormData, value);
            } else {
              setValue(key as keyof PropertyFormData, value as any);
            }
          });
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPropertyData();
  }, [user, setValue]);

  // Handle form submission
  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Format data if needed
      const formattedData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      // Update or insert based on whether we have an existing property
      if (property?.id) {
        result = await supabase
          .from("properties")
          .update(formattedData)
          .eq("id", property.id);
      } else {
        result = await supabase
          .from("properties")
          .insert([formattedData])
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success("Property settings saved successfully");
      
      // Update local state
      if (result.data) {
        setProperty(result.data[0] || result.data);
      }
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast.error(error.message || "Failed to save property settings");
    } finally {
      setIsSaving(false);
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
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Image must be less than 10MB");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `property-${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;
      
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
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);
        
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
        main_photo_url: publicUrl
      });
      
      setValue("main_photo_url", publicUrl);
      toast.success("Property image updated!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Tab classnames helper
  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
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
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className={`
                flex items-center px-4 py-2 rounded-md shadow-sm
                ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
                text-white font-medium text-sm
              `}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
              <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-600 p-1 mb-8">
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 focus:outline-none transition-all',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-white hover:bg-blue-700/80'
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
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 focus:outline-none transition-all',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-white hover:bg-blue-700/80'
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
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 focus:outline-none transition-all',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-white hover:bg-blue-700/80'
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
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 focus:outline-none transition-all',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-white hover:bg-blue-700/80'
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
                          {...register("name", { required: "Property name is required" })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                          Address
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
                  </Tab.Panel>
                
                  {/* Visual Assets */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Main Property Photo</h3>
                      <div className="mb-6">
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                          <div className="relative h-64 w-full mb-4">
                            {property?.main_photo_url ? (
                              <Image
                                src={property.main_photo_url}
                                alt={property.name || "Property"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-gray-400">No main photo uploaded yet</p>
                              </div>
                            )}
                            
                            {/* Upload progress indicator */}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                                <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-150"
                                    style={{width: `${uploadProgress}%`}}
                                  ></div>
                                </div>
                                <p className="text-white">Uploading... {uploadProgress}%</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 flex justify-end">
                            <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload New Photo
                              <input 
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                onChange={handleImageUpload}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4">Additional Property Photos</h3>
                      <p className="text-gray-500 mb-4">
                        Feature coming soon: Upload multiple images for your property gallery.
                      </p>
                      
                      <h3 className="text-lg font-medium mb-4">Floor Plan</h3>
                      <p className="text-gray-500 mb-4">
                        Feature coming soon: Upload floor plans of your property.
                      </p>
                    </div>
                  </Tab.Panel>
                  
                  {/* Property Details */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Wi-Fi Information */}
                      <div className="col-span-1 md:col-span-2 border-b pb-4 mb-4">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Wifi className="h-5 w-5 mr-2 text-blue-500" />
                          Wi-Fi Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Wi-Fi Network Name
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
                        </div>
                      </div>
                      
                      {/* Check-in/Check-out Instructions */}
                      <div className="col-span-1 md:col-span-2 border-b pb-4 mb-4">
                        <h3 className="text-lg font-medium mb-4">Check-in/Check-out</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Check-in Instructions
                            </label>
                            <textarea
                              {...register("check_in_instructions")}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Instructions for guests arriving at your property..."
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Check-out Instructions
                            </label>
                            <textarea
                              {...register("check_out_instructions")}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Instructions for guests departing your property..."
                            ></textarea>
                          </div>
                        </div>
                      </div>
                      
                      {/* House Rules */}
                      <div className="col-span-1 md:col-span-2 border-b pb-4 mb-4">
                        <h3 className="text-lg font-medium mb-4">House Rules</h3>
                        <textarea
                          {...register("house_rules")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="List your house rules here..."
                        ></textarea>
                      </div>
                      
                      {/* Security & Parking */}
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Shield className="h-5 w-5 mr-2 text-blue-500" />
                          Security Information
                        </h3>
                        <textarea
                          {...register("security_info")}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Alarm codes, emergency contacts, etc..."
                        ></textarea>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Car className="h-5 w-5 mr-2 text-blue-500" />
                          Parking Information
                        </h3>
                        <textarea
                          {...register("parking_info")}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Parking instructions and regulations..."
                        ></textarea>
                      </div>
                      
                      {/* Amenities */}
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-medium mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {commonAmenities.map((amenity) => (
                            <div key={amenity} className="flex items-start">
                              <input
                                type="checkbox"
                                id={`amenity-${amenity}`}
                                value={amenity}
                                className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`amenity-${amenity}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                {amenity}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                  
                  {/* Location & Area */}
                  <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Map Coordinates */}
                      <div className="col-span-1 md:col-span-2 mb-4">
                        <h3 className="text-lg font-medium mb-4">Map Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Latitude
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              {...register("latitude")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Longitude
                            </label>
                            <input
                              type="number"
                              step="0.000001"
                              {...register("longitude")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Map Preview Placeholder */}
                        <div className="mt-4 bg-gray-100 border rounded-lg h-64 flex items-center justify-center">
                          <p className="text-gray-500">Map preview coming soon</p>
                        </div>
                      </div>
                      
                      {/* Neighborhood Description */}
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-medium mb-4">Neighborhood</h3>
                        <textarea
                          {...register("neighborhood_description")}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe the neighborhood, nearby attractions, etc..."
                        ></textarea>
                      </div>
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
