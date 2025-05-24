"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/hooks/useTenant";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTenant) {
      alert("Please select a property portfolio first");
      return;
    }

    setIsLoading(true);
    try {
      const propertyData = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        tenant_id: currentTenant.id,
        created_by: currentTenant.owner_user_id,
      };

      console.log("Property data to insert:", propertyData);

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error("Property creation error:", error);
        throw error;
      }

      console.log("Property created:", data);
      router.push(`/properties/${data.id}`);
    } catch (error) {
      console.error("Error creating property:", error);
      alert(`Failed to create property: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Property</h1>
        
        {!currentTenant && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">Please select a property portfolio first</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Property Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !currentTenant}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700"
          >
            {isLoading ? "Creating..." : "Create Property"}
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}