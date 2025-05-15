"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import ChecklistItemForm from "@/components/features/checklists/ChecklistItemForm";
import { useLoadingTimeout } from "@/hooks/useLoadingTimeout";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  order_index: number;
  is_completed?: boolean;
}

interface Checklist {
  id: string;
  title: string;
  description: string;
}

interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order_index: number;
}

export default function ChecklistDetailPage() {
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  // Fetch checklist and items
  useEffect(() => {
    if (user && id) {
      fetchChecklist();
      fetchItems();
      fetchSections();
    }
  }, [user, id]);

  const fetchChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setChecklist(data);
    } catch (error) {
      console.error("Error fetching checklist:", error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Get checklist items
      const { data: itemsData, error: itemsError } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_id", id)
        .order("category")
        .order("order_index");

      if (itemsError) throw itemsError;

      // Get completed items for current user
      const { data: completionsData, error: completionsError } = await supabase
        .from("checklist_completions")
        .select("item_id")
        .eq("user_id", user!.id);

      if (completionsError) throw completionsError;

      // Mark completed items
      const completedItemIds = new Set(
        completionsData?.map((c) => c.item_id) || []
      );
      const itemsWithCompletionStatus =
        itemsData?.map((item) => ({
          ...item,
          is_completed: completedItemIds.has(item.id),
        })) || [];

      setItems(itemsWithCompletionStatus);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleToggleCompletion = async (
    itemId: string,
    isCompleted: boolean
  ) => {
    try {
      if (isCompleted) {
        // Remove completion
        await supabase
          .from("checklist_completions")
          .delete()
          .eq("item_id", itemId)
          .eq("user_id", user!.id);
      } else {
        // Add completion
        await supabase.from("checklist_completions").insert({
          item_id: itemId,
          user_id: user!.id,
        });
      }

      // Update local state
      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, is_completed: !isCompleted } : item
        )
      );
    } catch (error) {
      console.error("Error updating completion status:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await supabase.from("checklist_items").delete().eq("id", itemId);

      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting checklist item:", error);
    }
  };

  // Group items by category
  const itemsByCategory = items.reduce((groups, item) => {
    const category = item.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <ProtectedPageWrapper>
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {!checklist ? (
            <div className="text-center py-8">Loading checklist details...</div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">{checklist.title}</h1>

                  {hasPermission("manager") && (
                    <button
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                      onClick={() => setShowAddItemForm(true)}
                    >
                      <PlusIcon className="h-5 w-5 mr-1" />
                      Add Item
                    </button>
                  )}
                </div>

                {checklist.description && (
                  <p className="mt-2 text-gray-600">{checklist.description}</p>
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
                      setTimedOut(false);
                      setLoading(true);
                      fetchItems();
                    }}
                  >
                    Retry
                  </button>
                  <button
                    className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                    onClick={() =>
                      (window.location.href = "/admin/diagnostics")
                    }
                  >
                    Run Diagnostics
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No items in this checklist</p>
                  {hasPermission("manager") && (
                    <p className="text-gray-500 text-sm mt-2">
                      Add your first item to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(itemsByCategory).map(
                    ([category, categoryItems]) => (
                      <div
                        key={category}
                        className="bg-white rounded-lg shadow overflow-hidden"
                      >
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h2 className="font-medium text-lg">{category}</h2>
                        </div>

                        <ul>
                          {categoryItems.map((item) => (
                            <li
                              key={item.id}
                              className={`border-b last:border-b-0 px-4 py-3 ${
                                item.is_completed ? "bg-green-50" : ""
                              }`}
                            >
                              <div className="flex items-start">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full border mr-3 cursor-pointer flex items-center justify-center ${
                                    item.is_completed
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300"
                                  }`}
                                  onClick={() =>
                                    handleToggleCompletion(
                                      item.id,
                                      !!item.is_completed
                                    )
                                  }
                                >
                                  {item.is_completed && (
                                    <CheckIcon className="h-4 w-4 text-white" />
                                  )}
                                </div>

                                <div className="flex-grow">
                                  <h3
                                    className={`font-medium ${
                                      item.is_completed
                                        ? "line-through text-green-700"
                                        : ""
                                    }`}
                                  >
                                    {item.title}
                                  </h3>

                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                {hasPermission("manager") && (
                                  <div className="flex-shrink-0 flex space-x-2">
                                    <button
                                      onClick={() => setEditingItem(item)}
                                      className="text-gray-400 hover:text-blue-500"
                                      title="Edit item"
                                    >
                                      <PencilIcon className="h-5 w-5" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="text-gray-400 hover:text-red-500"
                                      title="Delete item"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Item Form */}
      {(showAddItemForm || editingItem) && (
        <ChecklistItemForm
          checklistId={id as string}
          item={editingItem}
          onClose={() => {
            setShowAddItemForm(false);
            setEditingItem(null);
          }}
          onSaved={() => {
            fetchItems();
            setShowAddItemForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </ProtectedPageWrapper>
  );
}
