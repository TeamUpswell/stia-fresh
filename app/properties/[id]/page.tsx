"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

interface Property {
  id: string;
  name: string;
  description?: string;
  contact_info?: string;
  main_photo_url?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  // Add any other fields your property might have
}

export default function PropertyPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPropertyData() {
      if (!propertyId) {
        console.error("No property ID provided");
        setError("Property ID is required");
        setLoading(false);
        return;
      }

      try {
        console.log("Starting property data fetch for ID:", propertyId);

        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();

        if (error) {
          console.error("Error loading property:", error);
          if (error.code === "42P01") {
            console.error("Property table doesn't exist!");
            setError("Database configuration issue. Please contact support.");
          } else if (error.code === "PGRST116") {
            console.error("Row-level security prevented access");
            setError("You don't have permission to view this property.");
          } else {
            setError(error.message);
          }
          return;
        }

        if (data) {
          setProperty(data as Property);
        }

        console.log("Property data retrieved:", data);
      } catch (err) {
        console.error("Unexpected error loading property:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadPropertyData();
  }, [propertyId]);

  return (
    <AuthenticatedLayout>
      <ErrorBoundary
        fallback={
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-xl font-semibold text-red-700">
              Error Loading Property
            </h2>
            <p className="mt-2">
              {error ||
                "There was a problem loading this property. Please try again later."}
            </p>
          </div>
        }
      >
        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : property ? (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">
              {property.name || "Property Details"}
            </h1>

            <div className="bg-white shadow rounded-lg p-6">
              {property.main_photo_url && (
                <div className="mb-6">
                  <img
                    src={property.main_photo_url}
                    alt={property.name || "Property"}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      console.error("Failed to load property image");
                      e.currentTarget.src = "/images/placeholder-property.jpg";
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Details</h2>
                  <p className="text-gray-600 mt-2">
                    {property.description || "No description available."}
                  </p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Contact</h2>
                  <p className="text-gray-600 mt-2">
                    {property.contact_info ||
                      "No contact information available."}
                  </p>
                </div>
              </div>

              {property && property.contact_info && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <p>{property.contact_info}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-700">
              Property Not Found
            </h2>
            <p className="mt-2">The requested property could not be found.</p>
          </div>
        )}
      </ErrorBoundary>
    </AuthenticatedLayout>
  );
}
