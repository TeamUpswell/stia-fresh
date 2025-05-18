"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Save, Upload, MapPin, Home, X } from "lucide-react";
import Image from "next/image";
import { loadMapsApi } from "@/lib/googleMaps";

// Simple version to get started
export default function PropertySettingsPage() {
  const { user } = useAuth();
  const [property, setProperty] = useState({
    name: "",
    address: "",
    main_photo_url: "",
    description: "",
    check_in_time: "15:00",
    check_out_time: "11:00",
    wifi_name: "",
    wifi_password: "",
    latitude: 0,
    longitude: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchPropertyData();
  }, []);

  useEffect(() => {
    const initializeGooglePlaces = async () => {
      try {
        // Load the Maps API with proper libraries
        await loadMapsApi();

        // Once loaded, set the map as loaded
        setMapLoaded(true);

        // Initialize Places Autocomplete only after API is loaded
        if (addressInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
            types: ['address'],
            fields: ['formatted_address', 'geometry', 'name']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();

            if (!place.geometry) {
              console.warn("Place selected has no geometry data");
              return;
            }

            // Update property with selected place data
            setProperty(prev => ({
              ...prev,
              address: place.formatted_address || prev.address,
              latitude: place.geometry?.location.lat() || prev.latitude,
              longitude: place.geometry?.location.lng() || prev.longitude
            }));

            console.log("Place selected:", place);
          });
        }
      } catch (error) {
        console.error("Error initializing Google Places:", error);
        toast.error("Failed to initialize address lookup");
      }
    };

    initializeGooglePlaces();
  }, []); // Run once on component mount

  const fetchPropertyData = async () => {
    setIsLoading(true);
    try {
      // Try to get existing property
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors if no data

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        console.log("Property data loaded:", data);
        setProperty(data);
      } else {
        console.log("No property data found, using defaults");
        // Keep using default values
      }
    } catch (error) {
      console.error("Error fetching property data:", error);
      toast.error("Failed to load property information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("properties").upsert({
        ...property,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Property settings saved successfully");
    } catch (error) {
      console.error("Error saving property settings:", error);
      toast.error("Failed to save property settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileSize = file.size / 1024 / 1024; // size in MB
    
    if (fileSize > 5) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `property-${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      // Upload the image
      const { error: uploadError } = await supabase.storage
        .from("properties")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.uploadedBytes / progress.totalBytes) * 100);
            setUploadProgress(percent);
          },
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      if (urlData) {
        setProperty({...property, main_photo_url: urlData.publicUrl});
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Property Settings</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="h-4 w-4 border-t-2 border-white rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Settings
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="property-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Property Name
                </label>
                <input
                  id="property-name"
                  type="text"
                  value={property.name}
                  onChange={(e) =>
                    setProperty({ ...property, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="property-address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Property Address
                </label>
                <div className="relative">
                  <input
                    id="property-address"
                    type="text"
                    ref={addressInputRef}
                    value={property.address}
                    onChange={(e) =>
                      setProperty({ ...property, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Start typing to search for an address..."
                  />
                  {!mapLoaded && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {mapLoaded && (
                  <p className="mt-1 text-sm text-gray-500">
                    Start typing and select an address from the dropdown for
                    accurate location data
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="property-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="property-description"
                  value={property.description}
                  onChange={(e) =>
                    setProperty({ ...property, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Image
                </label>
                <div className="mt-1 flex items-center">
                  {property.main_photo_url ? (
                    <div className="relative w-full">
                      <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={property.main_photo_url}
                          alt="Property"
                          fill
                          style={{ objectFit: "cover" }}
                          className="rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setProperty({ ...property, main_photo_url: "" })
                        }
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                        aria-label="Remove property image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label htmlFor="property-image-upload" className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        Upload a photo
                        <input
                          id="property-image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileUpload}
                          aria-label="Upload property image"
                        />
                      </label>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{"--progress-width": `${uploadProgress}%`} as React.CSSProperties}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 text-center">
                      Uploading: {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
