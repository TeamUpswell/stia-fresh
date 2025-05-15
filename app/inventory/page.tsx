"use client";

import { useState, useEffect } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { PlusIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useAuth, User } from "@/components/AuthProvider"; // Updated import to include User
import { InventoryItem } from "@/types/inventory";

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
    setTimedOut, // Add this line
  };
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    description: "",
    category: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Update this line to include setTimedOut
  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: 1,
      description: "",
      category: "",
    });
  };

  const fetchItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="manager"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Sorry, you need manager permissions to access inventory.
            </p>
          </div>
        }
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Inventory</h1>
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
                  onClick={() => (window.location.href = "/admin/diagnostics")}
                >
                  Run Diagnostics
                </button>
              </div>
            ) : (
              // Your normal content when loaded
              <div>{/* Rest of inventory UI */}</div>
            )}
          </div>
        </div>
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
