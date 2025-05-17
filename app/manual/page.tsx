"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";

// Define types that match your database schema
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

type Property = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  main_photo_url: string;
};

export default function ManualPage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchManualData() {
      setLoading(true);
      try {
        // Fetch property info
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .single();
          
        if (propertyData && !propertyError) {
          setProperty(propertyData);
        }
        
        // Fetch manual sections ordered by order_index
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('manual_sections')
          .select('*')
          .order('order_index');
          
        if (sectionsError) throw sectionsError;
        if (sectionsData && sectionsData.length > 0) {
          setSections(sectionsData);
          setActiveSection(sectionsData[0].id); // Set first section as active
          
          // Fetch all manual items
          const { data: itemsData, error: itemsError } = await supabase
            .from('manual_items')
            .select('*')
            .order('order_index');
            
          if (itemsError) throw itemsError;
          setItems(itemsData || []);
        }
      } catch (error) {
        console.error("Error fetching manual data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchManualData();
  }, []);
  
  // Get items for the active section
  const activeSectionItems = items.filter(
    item => item.section_id === activeSection
  ).sort((a, b) => {
    // Sort by importance first, then by order_index
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    return a.order_index - b.order_index;
  });
  
  // Function to get icon component
  const getIconComponent = (iconName: string) => {
    // @ts-ignore - Dynamic component import
    const Icon = LucideIcons[iconName.charAt(0).toUpperCase() + iconName.slice(1)] || LucideIcons.HelpCircle;
    return <Icon className="h-5 w-5 text-blue-500 mr-2" />;
  };
  
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Property Header with Photo */}
            {property && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-72 w-full">
                  {property.main_photo_url ? (
                    <Image 
                      src={property.main_photo_url} 
                      alt={property.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                      No property image available
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{property.name}</h1>
                    <p className="text-white/90">{property.address}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Emergency Information Banner */}
            {items.some(item => item.important) && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Important Information</p>
                    <p className="text-sm text-red-700">
                      Please review the highlighted important items in this manual for critical information.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Google Map */}
            {property && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Location</h2>
                  <div className="h-64 w-full rounded-lg overflow-hidden">
                    <GoogleMapComponent 
                      latitude={property.latitude}
                      longitude={property.longitude}
                      address={property.address}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Manual Content */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Sidebar with Sections */}
                <div className="w-full md:w-64 bg-gray-50 p-4">
                  <h2 className="font-bold text-lg mb-4">Manual Sections</h2>
                  <nav>
                    <ul>
                      {sections.map((section) => (
                        <li key={section.id} className="mb-1">
                          <button
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                              activeSection === section.id
                                ? "bg-blue-100 text-blue-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {getIconComponent(section.icon)}
                            {section.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 p-6">
                  {activeSection && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                          {sections.find(s => s.id === activeSection)?.title}
                        </h2>
                        <p className="text-gray-600">
                          {sections.find(s => s.id === activeSection)?.description}
                        </p>
                      </div>
                      
                      <div className="space-y-8">
                        {activeSectionItems.map(item => (
                          <div 
                            key={item.id} 
                            className={`border rounded-lg overflow-hidden ${
                              item.important ? "border-red-300 bg-red-50" : "border-gray-200"
                            }`}
                          >
                            <div className={`p-4 ${item.important ? "bg-red-100" : "bg-gray-50"}`}>
                              <h3 className={`font-bold text-lg ${item.important ? "text-red-700" : ""}`}>
                                {item.important && (
                                  <AlertCircle className="inline-block h-5 w-5 mr-2 text-red-500" />
                                )}
                                {item.title}
                              </h3>
                            </div>
                            <div className="p-4">
                              {/* Content */}
                              <div 
                                className="prose max-w-none" 
                                dangerouslySetInnerHTML={{ __html: item.content }}
                              />
                              
                              {/* Media (if available) */}
                              {item.media_urls && item.media_urls.length > 0 && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {item.media_urls.map((url, index) => (
                                    <div key={index} className="relative h-48 rounded-lg overflow-hidden">
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
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
