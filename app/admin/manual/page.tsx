"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/components/PropertyContext"; // Add this import
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import PermissionGate from "@/components/PermissionGate";
import { supabase } from "@/lib/supabase";
import { 
  ChevronDown, ChevronRight, Edit, Plus, Trash2, Save, X,
  Wifi, Car, Shield, Info, Home, MapPin, Clock, Book
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

// Define types for manual sections and items
interface ManualSection {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at?: string;
}

interface ManualItem {
  id: string;
  section_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at?: string;
}

export default function ManualAdminPage() {
  const { user, hasPermission } = useAuth();
  const { property, loading: propertyLoading } = useProperty(); // Use the property context
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  
  // Add state for editing custom content
  const [editingSection, setEditingSection] = useState<ManualSection | null>(null);
  const [editingItem, setEditingItem] = useState<ManualItem | null>(null);

  // Helper function to check roles
  const checkRole = (roles: string | string[]) => {
    if (Array.isArray(roles)) {
      return roles.some(role => hasPermission(role));
    }
    return hasPermission(roles);
  };
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // No need to fetch property data - it comes from context now
        
        // Fetch manual sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("manual_sections")
          .select("*")
          .order("order_index");
          
        if (sectionsError) throw sectionsError;
        setSections(sectionsData || []);
        
        // Fetch manual items
        const { data: itemsData, error: itemsError } = await supabase
          .from("manual_items")
          .select("*")
          .order("order_index");
          
        if (itemsError) throw itemsError;
        setItems(itemsData || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load manual content");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  // Function to classify tabs
  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }
  
  // Group items by section
  const itemsBySection = items.reduce((acc, item) => {
    if (!acc[item.section_id]) {
      acc[item.section_id] = [];
    }
    acc[item.section_id].push(item);
    return acc;
  }, {} as Record<string, ManualItem[]>);
  
  // Handle section/item updates
  const handleUpdateSection = async (section: ManualSection) => {
    try {
      const { error } = await supabase
        .from("manual_sections")
        .update(section)
        .eq("id", section.id);
        
      if (error) throw error;
      
      setSections(sections.map(s => s.id === section.id ? section : s));
      toast.success("Section updated!");
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };
  
  const handleUpdateItem = async (item: ManualItem) => {
    try {
      const { error } = await supabase
        .from("manual_items")
        .update(item)
        .eq("id", item.id);
        
      if (error) throw error;
      
      setItems(items.map(i => i.id === item.id ? item : i));
      toast.success("Item updated!");
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };
  
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">House Manual</h1>
          
          {/* Admin controls */}
          {checkRole(["owner", "manager"]) && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`
                px-4 py-2 rounded-md
                ${editMode 
                  ? "bg-gray-200 text-gray-800" 
                  : "bg-blue-600 text-white hover:bg-blue-700"}
                flex items-center gap-2
              `}
            >
              {editMode ? (
                <>
                  <X size={16} /> Exit Edit Mode
                </>
              ) : (
                <>
                  <Edit size={16} /> Edit Manual
                </>
              )}
            </button>
          )}
        </div>
        
        {loading || propertyLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Tab.Group vertical onChange={setActiveTab} selectedIndex={activeTab}>
                <Tab.List className="space-y-1">
                  {/* Property Info Tab */}
                  <Tab className={({ selected }) =>
                    classNames(
                      'w-full py-2.5 text-left text-sm leading-5 rounded-md',
                      'focus:outline-none',
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800 hover:bg-gray-200'
                    )
                  }>
                    <div className="flex items-center">
                      <Home size={18} className="mr-2" />
                      <span>Property Information</span>
                    </div>
                  </Tab>
                  
                  {/* Check-in/out Tab */}
                  <Tab className={({ selected }) =>
                    classNames(
                      'w-full py-2.5 text-left text-sm leading-5 rounded-md',
                      'focus:outline-none',
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800 hover:bg-gray-200'
                    )
                  }>
                    <div className="flex items-center">
                      <Clock size={18} className="mr-2" />
                      <span>Check-in & Check-out</span>
                    </div>
                  </Tab>
                  
                  {/* Practical Info Tab */}
                  <Tab className={({ selected }) =>
                    classNames(
                      'w-full py-2.5 text-left text-sm leading-5 rounded-md',
                      'focus:outline-none',
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800 hover:bg-gray-200'
                    )
                  }>
                    <div className="flex items-center">
                      <Info size={18} className="mr-2" />
                      <span>Practical Information</span>
                    </div>
                  </Tab>
                  
                  {/* Custom Sections Tabs */}
                  {sections.map(section => (
                    <Tab
                      key={section.id}
                      className={({ selected }) =>
                        classNames(
                          'w-full py-2.5 text-left text-sm leading-5 rounded-md',
                          'focus:outline-none',
                          selected
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-800 hover:bg-gray-200'
                        )
                      }
                    >
                      <div className="flex items-center">
                        <Book size={18} className="mr-2" />
                        <span>{section.title}</span>
                      </div>
                    </Tab>
                  ))}
                  
                  {/* Add Section button (admin only) */}
                  {editMode && checkRole(["owner", "manager"]) && (
                    <button 
                      className="w-full py-2.5 text-left text-sm leading-5 rounded-md
                                text-blue-600 hover:bg-blue-50 flex items-center"
                      onClick={() => {/* Logic to add section */}}
                    >
                      <Plus size={18} className="mr-2" />
                      <span>Add New Section</span>
                    </button>
                  )}
                </Tab.List>
              </Tab.Group>
            </div>
            
            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-3">
              <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                <Tab.Panels>
                  {/* Property Information Panel */}
                  <Tab.Panel>
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold mb-2 flex items-center">
                          <Home size={20} className="mr-2" />
                          {property?.name || "Property Information"}
                          
                          {editMode && checkRole(["owner", "manager"]) && (
                            <button 
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              onClick={() => {/* Navigate to property settings */}}
                              aria-label="Edit property information"
                              title="Edit property information"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </h2>
                        
                        <div className="flex items-start mb-4">
                          <MapPin className="mt-1 mr-2 text-gray-500" size={18} />
                          <p className="text-gray-700">
                            {property?.address}, {property?.city}, {property?.state} {property?.zip}
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 mb-1">About this property</h3>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{property?.description || ""}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">About the neighborhood</h3>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{property?.neighborhood_description || ""}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                  
                  {/* Check-in & Check-out Panel */}
                  <Tab.Panel>
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                          <Clock size={20} className="mr-2" />
                          Check-in & Check-out Instructions
                          
                          {editMode && checkRole(["owner", "manager"]) && (
                            <button 
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              onClick={() => {/* Navigate to property settings */}}
                              aria-label="Edit check-in instructions"
                              title="Edit check-in instructions"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </h2>
                        
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-900 mb-1">Check-in Instructions</h3>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{property?.check_in_instructions || ""}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-900 mb-1">Check-out Instructions</h3>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{property?.check_out_instructions || ""}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">House Rules</h3>
                          <div className="prose max-w-none">
                            <ReactMarkdown>{property?.house_rules || ""}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                  
                  {/* Practical Information Panel */}
                  <Tab.Panel>
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Info size={20} className="mr-2" />
                        Practical Information
                        
                        {editMode && checkRole(["owner", "manager"]) && (
                          <button 
                            className="ml-2 text-gray-400 hover:text-blue-600"
                            onClick={() => {/* Navigate to property settings */}}
                            aria-label="Edit practical information"
                            title="Edit practical information"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </h2>
                      
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                          <Wifi size={18} className="mr-2" />
                          WiFi Information
                        </h3>
                        <p><strong>Network:</strong> {property?.wifi_name}</p>
                        <p><strong>Password:</strong> {property?.wifi_password}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                          <Car size={18} className="mr-2" />
                          Parking Information
                        </h3>
                        <div className="prose max-w-none">
                          <ReactMarkdown>{property?.parking_info || ""}</ReactMarkdown>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                          <Shield size={18} className="mr-2" />
                          Security Information
                        </h3>
                        <div className="prose max-w-none">
                          <ReactMarkdown>{property?.security_info || ""}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                  
                  {/* Custom Section Panels */}
                  {sections.map(section => (
                    <Tab.Panel key={section.id}>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-bold mb-4 flex items-center">
                            <Book size={20} className="mr-2" />
                            {section.title}
                          </h2>
                          
                          {editMode && checkRole(["owner", "manager"]) && (
                            <div className="flex gap-2">
                              <button 
                                className="text-gray-400 hover:text-blue-600"
                                onClick={() => setEditingSection(section)}
                                aria-label={`Edit ${section.title} section`}
                                title={`Edit ${section.title} section`}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="text-gray-400 hover:text-red-600"
                                onClick={() => {/* Delete section */}}
                                aria-label={`Delete ${section.title} section`}
                                title={`Delete ${section.title} section`}
                              >
                                <Trash2 size={16} />
                              </button>
                              <button 
                                className="text-gray-400 hover:text-green-600"
                                onClick={() => {/* Add item to this section */}}
                                aria-label={`Add item to ${section.title} section`}
                                title={`Add item to ${section.title} section`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {section.description && (
                          <div className="prose max-w-none mb-4">
                            <ReactMarkdown>{section.description}</ReactMarkdown>
                          </div>
                        )}
                        
                        {/* Items within this section */}
                        <div className="space-y-4">
                          {itemsBySection[section.id]?.map(item => (
                            <div key={item.id} className="border-b pb-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-900">{item.title}</h3>
                                
                                {editMode && checkRole(["owner", "manager"]) && (
                                  <div className="flex gap-2">
                                    <button 
                                      className="text-gray-400 hover:text-blue-600"
                                      onClick={() => setEditingItem(item)}
                                      aria-label={`Edit ${item.title}`}
                                      title={`Edit ${item.title}`}
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button 
                                      className="text-gray-400 hover:text-red-600"
                                      onClick={() => {/* Delete item */}}
                                      aria-label={`Delete ${item.title}`}
                                      title={`Delete ${item.title}`}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="prose max-w-none">
                                <ReactMarkdown>{item.content}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                          
                          {(!itemsBySection[section.id] || itemsBySection[section.id].length === 0) && (
                            <p className="text-gray-500 italic">
                              No items in this section yet.
                              {editMode && " Click the + button above to add content."}
                            </p>
                          )}
                        </div>
                      </div>
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}