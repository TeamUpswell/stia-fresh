"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import PermissionGate from "@/components/PermissionGate";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// Define inventory item type based on your actual database schema
type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  threshold: number;
  user_id: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
};

// Update the hook to return setTimedOut
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
    setTimedOut,
  };
}

// Add this function when implementing inventory image uploads
const handleInventoryImageUpload = async (file: File, itemId: string) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `inventory-${itemId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("inventory")
      .upload(fileName, file, {
        cacheControl: "31536000", // 1 year for static inventory images
        upsert: true,
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("inventory")
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading inventory image:", error);
    throw error;
  }
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    category: "",
    threshold: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(true, 8000);

  const categories = ["supplies", "cleaning", "kitchen", "bathroom", "other"];

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: 1,
      category: "supplies",
      threshold: 5,
    });
  };

  const fetchItems = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      setError("Failed to fetch inventory items");
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setItems, setError, supabase]);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user, fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);
      
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("inventory")
          .update({
            name: formData.name,
            quantity: formData.quantity,
            category: formData.category,
            threshold: formData.threshold, // Make sure this matches your DB column name exactly
            last_updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from("inventory")
          .insert({
            name: formData.name,
            quantity: formData.quantity,
            category: formData.category,
            threshold: formData.threshold,
            user_id: user.id,
            last_updated_by: user.id
          });

        if (error) throw error;
      }

      // Refresh items list
      await fetchItems();
      setIsAddingItem(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving inventory item:", err);
      setError(err.message || "An error occurred while saving");
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      threshold: item.threshold || 5,
    });
    setEditingItem(item);
    setIsAddingItem(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setError(null);
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Refresh items list
      await fetchItems();
    } catch (err: any) {
      console.error("Error deleting inventory item:", err);
      setError(err.message || "An error occurred while deleting");
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user) return;

    try {
      setError(null);
      const { error } = await supabase
        .from("inventory")
        .update({
          quantity: quantity,
          last_updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    } catch (err: any) {
      console.error("Error updating quantity:", err);
      setError(err.message || "An error occurred while updating quantity");
    }
  };

  // Filter items based on category and low stock
  const filteredItems = items.filter(item => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }
    
    if (lowStockOnly && item.threshold && item.quantity > item.threshold) {
      return false;
    }
    
    return true;
  });

  return (
    <AuthenticatedLayout>
      <PermissionGate 
        requiredRole="manager" 
        fallback={<div className="p-8 text-center">Sorry, you need manager permissions to access inventory.</div>}
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => {
                  resetForm();
                  setEditingItem(null);
                  setIsAddingItem(true);
                }}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Item
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 w-full"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center ml-0 md:ml-4">
                  <input 
                    id="low-stock"
                    type="checkbox" 
                    checked={lowStockOnly} 
                    onChange={e => setLowStockOnly(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="low-stock" className="ml-2 text-sm text-gray-700">
                    Show Low Stock Only
                  </label>
                </div>
              </div>
            </div>

            {loading && !timedOut ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading inventory items...</p>
              </div>
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
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 font-medium text-gray-700">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Threshold</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table body */}
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No inventory items found.
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-t ${
                        item.quantity <= item.threshold ? "bg-red-50" : ""
                      }`}
                    >
                      <div className="col-span-4 font-medium">{item.name}</div>
                      <div className="col-span-2">{item.category}</div>
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={item.quantity}
                            min="0"
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 p-1 border rounded text-center"
                            aria-label={`Quantity for ${item.name}`}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">{item.threshold}</div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          aria-label={`Edit ${item.name}`}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          aria-label={`Delete ${item.name}`}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </PermissionGate>

      {/* Add/Edit Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Item Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="threshold" className="block text-sm font-medium mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    id="threshold"
                    type="number"
                    min="0"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
