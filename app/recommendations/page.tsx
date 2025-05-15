"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  PlusIcon,
  MapPinIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import RecommendationCard from "@/components/features/recommendations/RecommendationCard";
import RecommendationForm from "@/components/features/recommendations/RecommendationForm";
import PermissionGate from "@/components/PermissionGate";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  rating?: number;
  website?: string;
  phone_number?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export default function RecommendationsPage() {
  const { user, hasPermission } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<
    Recommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Categories for filtering
  const categories = [
    "All",
    "Restaurant",
    "Hike",
    "Activity",
    "Shopping",
    "Beach",
    "Other",
  ];

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  useEffect(() => {
    // Filter recommendations based on search term and category
    const filtered = recommendations.filter((rec) => {
      const matchesSearch =
        rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || rec.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    setFilteredRecommendations(filtered);
  }, [searchTerm, categoryFilter, recommendations]);

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .order("name");

    if (!error) {
      setRecommendations(data || []);
    } else {
      console.error("Error fetching recommendations:", error);
    }
    setLoading(false);
  };

  const handleEdit = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("recommendations")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchRecommendations();
    }
  };

  const handleSave = async (data: any) => {
    if (selectedRecommendation) {
      // Update existing recommendation
      const { error } = await supabase
        .from("recommendations")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRecommendation.id);

      if (!error) {
        fetchRecommendations();
        setShowForm(false);
        setSelectedRecommendation(null);
      }
    } else {
      // Add new recommendation
      const { error } = await supabase.from("recommendations").insert([
        {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (!error) {
        fetchRecommendations();
        setShowForm(false);
      }
    }
  };

  return (
    <ProtectedPageWrapper>
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">Local Recommendations</h1>

            {/* Only managers and owners can add recommendations */}
            <PermissionGate requiredRole="manager">
              <button
                onClick={() => {
                  setSelectedRecommendation(null);
                  setShowForm(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Recommendation
              </button>
            </PermissionGate>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <label htmlFor="category-filter" className="sr-only">
                  Filter by category
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recommendations Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading recommendations...</p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium mt-4">
                No recommendations found
              </h3>
              <p className="text-gray-600 mt-2">
                {searchTerm || categoryFilter !== "All"
                  ? "Try changing your search or filter settings"
                  : "Add your first recommendation to get started"}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  showEditControls={hasPermission("manager")}
                  onEdit={
                    hasPermission("manager")
                      ? () => handleEdit(recommendation)
                      : undefined
                  }
                  onDelete={
                    hasPermission("manager")
                      ? () => handleDelete(recommendation.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendation Form Modal */}
      {showForm && (
        <RecommendationForm
          recommendation={selectedRecommendation}
          categories={categories.filter((cat) => cat !== "All")}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedRecommendation(null);
          }}
        />
      )}
    </ProtectedPageWrapper>
  );
}
