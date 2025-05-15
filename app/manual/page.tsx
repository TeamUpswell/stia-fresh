"use client";

import { useState, useEffect } from "react";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { PlusIcon } from "@heroicons/react/24/outline";
// Rename the import to avoid naming conflict
import ManualSectionComponent from "@/components/features/manual/ManualSection";
import SectionForm from "@/components/features/manual/SectionForm";
import ItemForm from "@/components/features/manual/ItemForm";
// Keep the type imports
import type { ManualSection, ManualItem } from "@/types/manual";

// Add this hook to any component with loading states
function useLoadingTimeout(initialLoading = false, timeoutMs = 10000) {
  const [loading, setLoading] = useState(initialLoading);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => {
        setTimedOut(true);
      }, timeoutMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, timeoutMs]);

  return {
    loading,
    setLoading,
    timedOut,
    setTimedOut, // Add this line to expose the setTimedOut function
  };
}

export default function ManualPage() {
  const { user, hasPermission } = useAuth();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingSection, setEditingSection] = useState<ManualSection | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<ManualItem | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  useEffect(() => {
    if (user) {
      fetchSections();
    }
  }, [user]);

  useEffect(() => {
    if (sections.length > 0) {
      fetchItems();
    }
  }, [sections]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      console.log("Fetching sections...");
      const startTime = performance.now();

      const { data, error, status } = await supabase
        .from("manual_sections")
        .select("*")
        .order("order_index");

      const endTime = performance.now();
      console.log(`Sections query completed in ${endTime - startTime}ms`);

      if (error) {
        console.error("Error fetching sections:", error);
        console.error("Status code:", status);
        throw error;
      }

      console.log(`Received ${data?.length || 0} sections`);
      setSections(data || []);

      // If no sections found and no explicit error, log this condition
      if (!data || data.length === 0) {
        console.warn(
          "No sections found in database, this may be expected for new setups"
        );
      }
    } catch (error) {
      console.error("Exception in fetchSections:", error);
      // Set an error state that can be shown to users
      setError(
        "Failed to load sections. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("manual_items")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching manual items:", error);
    }
  };

  // Update your createDefaultSections function to include recommendations
  const createDefaultSections = async () => {
    const sections = [
      {
        title: "Welcome & Essentials",
        description:
          "Quick welcome note, home address, Wi-Fi, and emergency contacts",
        icon: "home", // This is fine as icon is string | undefined
        order_index: 0,
      },
      {
        title: "Arrival & Departure",
        description:
          "Step-by-step checklists for arriving and leaving the property",
        icon: "key",
        order_index: 1,
      },
      {
        title: "House Rules & Etiquette",
        description:
          "Guidelines for enjoying the home while respecting it and others",
        icon: "rules",
        order_index: 2,
      },
      {
        title: "Safety & Emergency",
        description: "Important safety information and emergency procedures",
        icon: "emergency",
        order_index: 3,
      },
      {
        title: "Technology & Appliances",
        description:
          "Instructions for electronics, smart home features, and appliances",
        icon: "device",
        order_index: 4,
      },
      {
        title: "Inventory & Supplies",
        description: "What's available and where to find it",
        icon: "inventory",
        order_index: 5,
      },
      {
        title: "Maintenance & Troubleshooting",
        description: "Common issues and how to resolve them",
        icon: "tools",
        order_index: 6,
      },
      {
        title: "Community & Neighborhood",
        description:
          "Local guidelines, HOA rules, and our favorite nearby places & recommendations",
        icon: "community",
        order_index: 7,
      },
      {
        title: "Cost Sharing & Payments",
        description: "Information about shared expenses and reimbursements",
        icon: "money",
        order_index: 8,
      },
      {
        title: "Feedback & Suggestions",
        description: "How to help improve the home experience",
        icon: "feedback",
        order_index: 9,
      },
    ];

    // Insert sections and collect the IDs
    let communitySectionId: string | null = null;

    for (const section of sections) {
      const { data, error } = await supabase
        .from("manual_sections")
        .insert([section])
        .select();

      if (!error && data && data.length > 0) {
        // If this is the Community & Neighborhood section, save its ID
        if (section.title === "Community & Neighborhood") {
          communitySectionId = data[0].id;
        }
      }
    }

    // If we found the community section, add recommendation items
    if (communitySectionId) {
      await addDefaultRecommendations(communitySectionId);
    }
  };

  // Example function to add default recommendation items to the Community section
  // You can call this after creating your sections if needed

  const addDefaultRecommendations = async (sectionId: string) => {
    const items = [
      {
        section_id: sectionId,
        title: "Dining Recommendations",
        content: `# Our Favorite Restaurants in Bend

## Breakfast & Coffee
- **Sparrow Bakery** - Famous for their ocean rolls! Great coffee and pastries. 10 min drive.
- **Backporch Coffee Roasters** - Best local coffee in town. Their pour-overs are amazing. 5 min walk.

## Lunch
- **Jackson's Corner** - Farm-to-table sandwiches and salads. Great outdoor seating. 15 min drive.
- **Spork** - Global street food with creative flavors. Don't miss the spicy fried chicken! 8 min drive.

## Dinner
- **Ariana Restaurant** - Our favorite special occasion spot. Make reservations in advance. 12 min drive.
- **Bos Taurus** - Amazing steaks if you're celebrating something special. 10 min drive.
- **Wild Rose** - Authentic Northern Thai. Get the Khao Soi! 15 min drive.`,
        important: false,
        media_urls: [],
        order_index: 0,
      },
      {
        section_id: sectionId,
        title: "Outdoor Activities",
        content: `# Favorite Outdoor Activities

## Summer
- **Floating the Deschutes** - Park at Riverbend Park and float to Drake Park. Tubes can be rented at Tumalo Creek Kayak.
- **Hiking Pilot Butte** - Easy hike with 360° views of Bend and surrounding mountains. 7 min drive.
- **Mountain Biking at Phil's Trail** - Great trails for all levels. 15 min drive.

## Winter
- **Mt. Bachelor** - World-class skiing just 25 minutes away. The Pine Marten lift has the best runs for intermediates.
- **Virginia Meissner Sno-Park** - Beautiful snowshoe trails with warming huts. Rentals available at REI.

## Year-Round
- **Smith Rock State Park** - World-famous climbing destination with hiking trails. 40 min drive.
- **Old Mill District** - Shopping and dining along the river. 8 min drive.`,
        important: false,
        media_urls: [],
        order_index: 1,
      },
      {
        section_id: sectionId,
        title: "Shopping & Services",
        content: `# Local Shopping & Services

## Groceries
- **Newport Avenue Market** - Gourmet grocery with amazing selection. 7 min drive.
- **Market of Choice** - Great organic options and prepared foods. 10 min drive.
- **Trader Joe's** - You know what it is! 15 min drive.

## Medical Services
- **St. Charles Medical Center** - Main hospital, emergency services. 10 min drive.
- **Summit Medical Group** - Walk-in clinic for non-emergencies. 8 min drive.
- **Walgreens Pharmacy** - Open late. 7 min drive.`,
        important: false,
        media_urls: [],
        order_index: 2,
      },
    ];

    // Insert each item
    for (const item of items) {
      await supabase.from("manual_items").insert([item]);
    }
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setShowSectionForm(true);
  };

  const handleEditSection = (section: ManualSection) => {
    setEditingSection(section);
    setShowSectionForm(true);
  };

  const handleAddItem = (sectionId: string) => {
    setEditingItem(null);
    setSelectedSectionId(sectionId);
    setShowItemForm(true);
  };

  const handleEditItem = (item: ManualItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("manual_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      // Update local state to remove the item
      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const handleFormClose = () => {
    setShowSectionForm(false);
    setShowItemForm(false);
    setEditingSection(null);
    setEditingItem(null);
  };

  // Group items by section
  const itemsBySection: Record<string, ManualItem[]> = {};
  items.forEach((item) => {
    if (!itemsBySection[item.section_id]) {
      itemsBySection[item.section_id] = [];
    }
    itemsBySection[item.section_id].push(item);
  });

  return (
    <PermissionGate
      requiredRole="family"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            Sorry, you need family member permissions to access the house
            manual.
          </p>
        </div>
      }
    >
      <div className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">House Manual</h1>

            {hasPermission("manager") && (
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handleAddSection}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Section
              </button>
            )}
          </div>

          {loading && !timedOut ? (
            <div>Loading...</div>
          ) : timedOut ? (
            <div className="text-center p-8">
              <p className="text-red-500">Loading timed out</p>
              <p className="text-gray-600 mt-1">
                There might be an issue connecting to the database.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={() => {
                  setTimedOut(false); // Now this will work
                  setLoading(true);
                  fetchSections();
                }}
              >
                Retry
              </button>
              <button
                className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                onClick={() => (window.location.href = "/admin/diagnostics")}
              >
                Run Diagnostics
              </button>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No manual sections found</p>
              {hasPermission("manager") && (
                <p className="text-gray-500 text-sm mt-2">
                  Create your first section to start building the house manual
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Section navigation */}
              <div className="w-full md:w-64 bg-white rounded-lg shadow-sm overflow-hidden shrink-0">
                <div className="p-3 bg-gray-50 border-b">
                  <h2 className="font-medium">Sections</h2>
                </div>
                <nav className="p-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      className={`flex items-center w-full text-left px-3 py-2 rounded-md mb-1 ${
                        selectedSectionId === section.id
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      <span>{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Section content */}
              <div className="flex-1">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`${
                      selectedSectionId === section.id ? "block" : "hidden"
                    }`}
                  >
                    <ManualSectionComponent
                      section={section}
                      items={itemsBySection[section.id] || []}
                      onEditSection={
                        hasPermission("manager") ? handleEditSection : undefined
                      }
                      onAddItem={
                        hasPermission("manager") ? handleAddItem : undefined
                      }
                      onEditItem={
                        hasPermission("manager") ? handleEditItem : undefined
                      }
                      onDeleteItem={
                        hasPermission("manager") ? handleDeleteItem : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showSectionForm && (
        <SectionForm
          section={editingSection}
          onClose={handleFormClose}
          onSaved={() => {
            fetchSections();
            handleFormClose();
          }}
        />
      )}

      {showItemForm && (
        <ItemForm
          item={editingItem}
          sectionId={selectedSectionId!}
          onClose={handleFormClose}
          onSaved={() => {
            fetchItems();
            handleFormClose();
          }}
        />
      )}
    </PermissionGate>
  );
}
