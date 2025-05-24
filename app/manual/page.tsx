"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  Car,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Info,
  Clock,
  Home,
  Book,
} from "lucide-react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { toast } from "react-hot-toast"; // Or whichever toast library your project uses

// Keep your existing types
type ManualSection = {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  property_id: string;
};

type ManualItem = {
  id: string;
  section_id: string;
  title: string;
  content: string;
  media_urls: string[];
  order_index: number;
  important: boolean;
};

// Expand the Property type to include more fields from property settings
type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  main_photo_url: string;
  description: string;
  neighborhood_description: string;
  wifi_name: string;
  wifi_password: string;
  check_in_instructions: string;
  check_out_instructions: string;
  house_rules: string;
  security_info: string;
  parking_info: string;
};

export const dynamic = "force-dynamic";

export default function ManualPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    async function fetchManualData() {
      setLoading(true);
      try {
        // Fetch manual sections ordered by order_index
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("manual_sections")
          .select("*")
          .order("order_index");

        if (sectionsError) throw sectionsError;
        setSections(sectionsData || []);

        // Fetch all manual items
        const { data: itemsData, error: itemsError } = await supabase
          .from("manual_items")
          .select("*")
          .order("order_index");

        if (itemsError) throw itemsError;
        setItems(itemsData || []);

        // Initialize expanded state for important items
        if (itemsData) {
          const initialExpanded: Record<string, boolean> = {};
          itemsData.forEach((item) => {
            initialExpanded[item.id] = item.important;
          });
          setExpandedCards(initialExpanded);
        }
      } catch (error) {
        console.error("Error fetching manual data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchManualData();
  }, []);

  // Toggle card expanded state
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Function to get icon component
  const getIconComponent = (
    iconName: string,
    className = "h-5 w-5 text-blue-500"
  ) => {
    // @ts-ignore - Dynamic component import
    const Icon =
      LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)] ||
      LucideIcons.HelpCircle;
    return <Icon className={className} />;
  };

  // Group items by section
  const itemsBySection = sections.map((section) => {
    const sectionItems = items
      .filter((item) => item.section_id === section.id)
      .sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return a.order_index - b.order_index;
      });

    return {
      ...section,
      items: sectionItems,
    };
  });

  // Get important items across all sections
  const importantItems = items.filter((item) => item.important);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        {loading || !currentProperty ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Property Name Header */}
            {currentProperty && (
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  {currentProperty.name}
                </h1>
                <p className="text-gray-600 flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {currentProperty.address}, {currentProperty.city},{" "}
                  {currentProperty.state} {currentProperty.zip}
                </p>
              </div>
            )}

            {/* Important Information Banner */}
            {importantItems.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-800 font-medium">
                      Important Information
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {importantItems.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                // Expand the card and scroll to it
                                setExpandedCards((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }));
                                document
                                  .getElementById(`item-${item.id}`)
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                              }}
                              className="underline hover:text-red-900"
                            >
                              {item.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Essential Property Information */}
            {currentProperty && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2 text-blue-500" />
                    Essential Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* WiFi Card */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center mb-2">
                        <Wifi className="h-5 w-5 mr-2 text-blue-600" />
                        <h3 className="font-medium text-black">
                          WiFi Information
                        </h3>
                      </div>
                      <div className="pl-7">
                        <p className="text-sm mb-1 text-black">
                          <span className="font-medium">Network:</span>{" "}
                          {currentProperty.wifi_name || "Not provided"}
                        </p>
                        <p className="text-sm text-black">
                          <span className="font-medium">Password:</span>{" "}
                          {currentProperty.wifi_password || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {/* Check-in/out Card */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 mr-2 text-green-600" />
                        <h3 className="font-medium text-black">Check-in/out</h3>
                      </div>
                      <div className="pl-7 space-y-1 text-sm">
                        <p className="text-black">
                          <span className="font-medium">Check-in:</span>{" "}
                          {currentProperty.check_in_instructions?.split(
                            "\n"
                          )[0] || "See details below"}
                        </p>
                        <p className="text-black">
                          <span className="font-medium">Check-out:</span>{" "}
                          {currentProperty.check_out_instructions?.split(
                            "\n"
                          )[0] || "See details below"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Key Information Cards */}
                  <div className="space-y-4">
                    {currentProperty.parking_info && (
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCard("parking")}
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Car className="h-5 w-5 mr-2 text-blue-500" />
                            <h3 className="font-medium text-black">
                              Parking Information
                            </h3>
                          </div>
                          {expandedCards["parking"] ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>

                        {expandedCards["parking"] && (
                          <div className="p-4">
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: currentProperty.parking_info,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {currentProperty.security_info && (
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCard("security")}
                          className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-blue-500" />
                            <h3 className="font-medium text-black">
                              Security Information
                            </h3>
                          </div>
                          {expandedCards["security"] ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>

                        {expandedCards["security"] && (
                          <div className="p-4">
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: currentProperty.security_info,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Location & Map */}
            {currentProperty &&
              currentProperty.latitude &&
              currentProperty.longitude && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                      Location
                    </h2>
                    <div className="mb-4">
                      <div
                        className="prose max-w-none mb-4"
                        dangerouslySetInnerHTML={{
                          __html:
                            currentProperty.neighborhood_description || "",
                        }}
                      />
                    </div>
                    <div className="h-64 w-full rounded-lg overflow-hidden">
                      <GoogleMapComponent
                        latitude={currentProperty.latitude}
                        longitude={currentProperty.longitude}
                        address={currentProperty.address}
                      />
                    </div>
                  </div>
                </div>
              )}

            {/* Additional Manual Sections */}
            {itemsBySection.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    {getIconComponent(
                      section.icon,
                      "h-5 w-5 mr-2 text-blue-500"
                    )}
                    <span className="font-medium text-black">
                      {section.title}
                    </span>
                  </h2>

                  {section.description && (
                    <p className="text-gray-600 mb-6">{section.description}</p>
                  )}

                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div
                        id={`item-${item.id}`}
                        key={item.id}
                        className={`border rounded-lg overflow-hidden ${
                          item.important ? "border-red-300" : "border-gray-200"
                        }`}
                      >
                        <button
                          onClick={() => toggleCard(item.id)}
                          className={`w-full flex justify-between items-center p-4 text-left ${
                            item.important
                              ? "bg-red-50 hover:bg-red-100"
                              : "bg-gray-50 hover:bg-gray-100"
                          } transition-colors`}
                        >
                          <div className="flex items-center">
                            {item.important && (
                              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                            )}
                            <h3
                              className={`font-medium ${
                                item.important ? "text-red-800" : ""
                              }`}
                            >
                              {item.title}
                            </h3>
                          </div>
                          {expandedCards[item.id] ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>

                        {expandedCards[item.id] && (
                          <div className="p-4">
                            {/* Content */}
                            <div
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: item.content }}
                            />

                            {/* Media (if available) */}
                            {item.media_urls && item.media_urls.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {item.media_urls.map((url, index) => (
                                  <div
                                    key={index}
                                    className="relative h-48 rounded-lg overflow-hidden"
                                  >
                                    <Image
                                      src={url}
                                      alt={`${item.title} image ${index + 1}`}
                                      fill
                                      style={{ objectFit: "cover" }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {section.items.length === 0 && (
                      <p className="text-gray-500 italic text-center py-4">
                        No items in this section
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
