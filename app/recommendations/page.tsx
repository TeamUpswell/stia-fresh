"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import {
  Star,
  MapPin,
  ExternalLink,
  Phone,
  Plus,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Settings,
  Check,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import PlaceSearch from "@/components/PlaceSearch";
import ErrorBoundary from "@/components/ErrorBoundary";

// Import the types from the Google Maps API
type PlaceResult = google.maps.places.PlaceResult;

interface Coordinates {
  lat: number;
  lng: number;
}

interface Recommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  address?: string;
  coordinates?: Coordinates;
  phone_number?: string;
  website?: string;
  images?: string[];
  place_id?: string;
  rating?: number;
  is_recommended?: boolean;
  created_at: string;
}

interface RecommendationNote {
  id: string;
  recommendation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export default function RecommendationsPage() {
  const { user, hasPermission } = useAuth();
  const { currentProperty } = useProperty();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [recommendationStatus, setRecommendationStatus] = useState<
    "all" | "recommended" | "not_recommended"
  >("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, RecommendationNote[]>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecommendation, setNewRecommendation] = useState({
    name: "",
    category: "",
    address: "",
    description: "",
    website: "",
    phone_number: "",
    rating: 5,
    images: [""],
    is_recommended: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecommendation, setEditingRecommendation] =
    useState<Recommendation | null>(null);
  const [newNotes, setNewNotes] = useState<Record<string, string>>({});
  // const [property, setProperty] = useState(null); // Removed this line

  // For category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryEditName, setCategoryEditName] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("recommendation_categories")
        .select("name")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data) {
        console.log("Categories loaded:", data);
        setCategories(data.map((item) => item.name));
      } else {
        console.log("No categories found");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Don't show toast during SSR
      if (typeof window !== 'undefined') {
        toast.error("Failed to load categories");
      }
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!user || !currentProperty) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("property_id", currentProperty.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const recommendations = data || [];
      setRecommendations(recommendations);
      
      // Load notes for these recommendations
      if (recommendations.length > 0) {
        await fetchNotes(recommendations);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, currentProperty]);

  useEffect(() => {
    async function loadData() {
      try {
        if (!currentProperty) {
          setLoading(false);
          return;
        }

        // Load categories first
        await fetchCategories();

        // Then load recommendations
        await fetchRecommendations();
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, [currentProperty, fetchCategories, fetchRecommendations]);

  const fetchNotes = async (recommendations: Recommendation[]) => {
    if (recommendations.length === 0) return;

    try {
      const { data: notesData, error: notesError } = await supabase
        .from("recommendation_notes")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .in("recommendation_id", recommendations.map((rec) => rec.id));

      if (notesError) throw notesError;

      if (notesData && notesData.length > 0) {
        const groupedNotes: Record<string, RecommendationNote[]> = {};
        notesData.forEach((note) => {
          if (!groupedNotes[note.recommendation_id]) {
            groupedNotes[note.recommendation_id] = [];
          }

          const profile = Array.isArray(note.profiles)
            ? note.profiles[0]
            : note.profiles;

          const formattedNote = {
            ...note,
            user_name: profile?.full_name || "Anonymous User",
            user_avatar: profile?.avatar_url,
          };

          groupedNotes[note.recommendation_id].push(formattedNote);
        });

        setNotes(groupedNotes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesCategory =
      activeCategory === "all" || rec.category === activeCategory;

    if (recommendationStatus === "all") {
      return matchesCategory;
    } else if (recommendationStatus === "recommended") {
      return matchesCategory && rec.is_recommended !== false;
    } else {
      return matchesCategory && rec.is_recommended === false;
    }
  });

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProperty) {
      toast.error("No property selected");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recommendations")
        .insert([
          {
            ...newRecommendation,
            property_id: currentProperty.id, // Add this
            images: newRecommendation.images.filter((img) => img.trim() !== ""),
          },
        ])
        .select();

      if (error) throw error;

      toast.success("Recommendation added!");
      setShowAddForm(false);

      setNewRecommendation({
        name: "",
        category: "",
        address: "",
        description: "",
        website: "",
        phone_number: "",
        rating: 5,
        images: [""],
        is_recommended: true,
      });

      fetchRecommendations();
    } catch (error) {
      console.error("Error adding recommendation:", error);
      toast.error("Failed to add recommendation");
    }
  };

  const handleStartEditing = (recommendation: Recommendation) => {
    if (
      !hasPermission("owner") &&
      !hasPermission("manager") &&
      !hasPermission("family")
    ) {
      toast.error("You don't have permission to edit recommendations");
      return;
    }

    setEditingRecommendation(recommendation);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRecommendation) return;

    try {
      const { error } = await supabase
        .from("recommendations")
        .update({
          name: editingRecommendation.name,
          category: editingRecommendation.category,
          description: editingRecommendation.description,
          address: editingRecommendation.address,
          website: editingRecommendation.website,
          phone_number: editingRecommendation.phone_number,
          rating: editingRecommendation.rating,
          is_recommended: editingRecommendation.is_recommended,
        })
        .eq("id", editingRecommendation.id);

      if (error) throw error;

      toast.success("Recommendation updated!");
      setIsEditing(false);
      setEditingRecommendation(null);

      fetchRecommendations();
    } catch (error) {
      console.error("Error updating recommendation:", error);
      toast.error("Failed to update recommendation");
    }
  };

  const toggleRecommendationStatus = async (
    id: string,
    currentStatus: boolean | undefined
  ) => {
    if (
      !hasPermission("owner") &&
      !hasPermission("manager") &&
      !hasPermission("family")
    ) {
      toast.error("You don't have permission to change recommendation status");
      return;
    }

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("recommendations")
        .update({ is_recommended: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        `Marked as ${newStatus ? "Recommended" : "Not Recommended"}`
      );

      setRecommendations(
        recommendations.map((rec) =>
          rec.id === id ? { ...rec, is_recommended: newStatus } : rec
        )
      );
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    if (
      !hasPermission("owner") &&
      !hasPermission("manager") &&
      !hasPermission("family")
    ) {
      toast.error("You don't have permission to delete recommendations");
      return;
    }

    // Confirm before deleting
    if (
      window.confirm(
        "Are you sure you want to completely delete this recommendation? This action cannot be undone."
      )
    ) {
      try {
        const { error } = await supabase
          .from("recommendations")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast.success("Recommendation deleted successfully");

        // Update the local state by filtering out the deleted recommendation
        setRecommendations(recommendations.filter((rec) => rec.id !== id));
      } catch (error) {
        console.error("Error deleting recommendation:", error);
        toast.error("Failed to delete recommendation");
      }
    }
  };

  const handleAddNote = async (recommendationId: string) => {
    if (!user) {
      if (typeof window !== 'undefined') {
        toast.error("You must be logged in to add notes");
      }
      return;
    }

    const noteContent = newNotes[recommendationId];
    if (!noteContent || noteContent.trim() === "") {
      if (typeof window !== 'undefined') {
        toast.error("Note cannot be empty");
      }
      return;
    }

    try {
      const { data: newNote, error } = await supabase
        .from("recommendation_notes")
        .insert([{
          recommendation_id: recommendationId,
          user_id: user.id,
          content: noteContent,
        }])
        .select(`
          id, 
          recommendation_id, 
          user_id, 
          content, 
          created_at,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `);

      if (error) throw error;

      // Clear the input
      setNewNotes({
        ...newNotes,
        [recommendationId]: "",
      });

      if (newNote && newNote.length > 0) {
        const profiles = newNote[0].profiles;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;

        const formattedNote = {
          ...newNote[0],
          user_name: profile?.full_name || "Anonymous User",
          user_avatar: profile?.avatar_url || null,
        };

        setNotes((prevNotes) => ({
          ...prevNotes,
          [recommendationId]: [
            formattedNote,
            ...(prevNotes[recommendationId] || []),
          ],
        }));
      }

      if (typeof window !== 'undefined') {
        toast.success("Note added!");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      if (typeof window !== 'undefined') {
        toast.error("Failed to add note");
      }
    }
  };

  const handlePlaceSelect = (place: any) => {
    console.log("Selected place:", place);

    const newRecommendationData = {
      name: place.name || "",
      category: place.types?.[0]
        ? formatPlaceType(place.types[0])
        : "restaurant",
      address: place.formatted_address || "",
      description: place.editorial_summary?.overview || "",
      website: place.website || "",
      phone_number: place.formatted_phone_number || "",
      rating: place.rating || 5,
      place_id: place.place_id || "",
      images: place.photos
        ? place.photos
            .slice(0, 3)
            .map((photo: any) => {
              try {
                return photo.getUrl({ maxWidth: 800, maxHeight: 600 });
              } catch (e) {
                console.error("Error getting photo URL:", e);
                return ""; // Fallback empty string
              }
            })
            .filter((url: string) => url !== "") // Remove empty strings
        : [""],
      is_recommended: true,
    };

    setNewRecommendation(newRecommendationData);

    if (isEditing && editingRecommendation) {
      setEditingRecommendation({
        ...editingRecommendation,
        ...newRecommendationData,
      });
    }

    if (place.geometry?.location) {
      const coordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      if (isEditing && editingRecommendation) {
        setEditingRecommendation({
          ...editingRecommendation,
          coordinates,
        });
      } else {
        setNewRecommendation((prev) => ({
          ...prev,
          coordinates,
        }));
      }
    }
  };

  const formatPlaceType = (type: string): string => {
    const typeMap: Record<string, string> = {
      restaurant: "restaurant",
      cafe: "restaurant",
      bar: "restaurant",
      food: "restaurant",
      bakery: "restaurant",
      store: "shopping",
      shopping_mall: "shopping",
      clothing_store: "shopping",
      museum: "attraction",
      park: "attraction",
      tourist_attraction: "attraction",
      amusement_park: "attraction",
      art_gallery: "attraction",
      movie_theater: "entertainment",
      night_club: "entertainment",
      lodging: "lodging",
      campground: "lodging",
      rv_park: "lodging",
      doctor: "services",
      hospital: "services",
      pharmacy: "services",
      gas_station: "services",
      car_repair: "services",
      gym: "fitness",
      spa: "fitness",
    };

    return typeMap[type] || "other";
  };

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400 half-filled"
          />
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("recommendation_categories")
        .insert([
          {
            name: newCategory.trim(),
            created_by: user.id,
          },
        ]);

      if (error) throw error;

      toast.success("Category added");
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  // Edit existing category
  const handleSaveCategory = async (oldName: string) => {
    if (!categoryEditName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("recommendation_categories")
        .update({
          name: categoryEditName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("name", oldName);

      if (error) throw error;

      // Update recommendations with old category name
      await supabase
        .from("recommendations")
        .update({ category: categoryEditName.trim() })
        .eq("category", oldName);

      toast.success("Category updated");
      setEditingCategory(null);
      fetchCategories();
      fetchRecommendations();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  // Delete category
  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("recommendation_categories")
        .update({ is_active: false })
        .eq("name", name);

      if (error) throw error;

      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Add check for currentProperty
  if (!currentProperty) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-8 px-4 text-center">
          <p>Please select a property to view recommendations.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <ErrorBoundary
        fallback={
          <div className="container mx-auto py-8 px-4 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="mb-4">
              There was an error loading the recommendations. Please try again
              later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        }
      >
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {currentProperty.name} - Local Recommendations
              </h1>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                {showAddForm ? (
                  <>
                    <X size={16} />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Place</span>
                  </>
                )}
              </button>
            </div>

            {/* Category Management Modal */}
            {showCategoryModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Manage Categories</h2>
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close categories dialog"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Add Category Form */}
                    <form onSubmit={handleAddCategory} className="mb-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="New category name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </form>

                    {/* Categories List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <div
                            key={category}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                          >
                            {editingCategory === category ? (
                              <input
                                type="text"
                                value={categoryEditName}
                                onChange={(e) =>
                                  setCategoryEditName(e.target.value)
                                }
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-md"
                                autoFocus
                              />
                            ) : (
                              <span className="capitalize">{category}</span>
                            )}

                            <div className="flex items-center gap-1">
                              {editingCategory === category ? (
                                <>
                                  <button
                                    onClick={() => handleSaveCategory(category)}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    aria-label="Save category"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingCategory(null)}
                                    className="text-gray-600 hover:text-gray-800 p-1"
                                    aria-label="Cancel editing"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCategory(category);
                                      setCategoryEditName(category);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    aria-label="Edit category"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteCategory(category)
                                    }
                                    className="text-red-600 hover:text-red-800 p-1"
                                    aria-label="Delete category"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No categories found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showAddForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Add New Recommendation
                </h2>

                <div className="mb-6">
                  <label
                    htmlFor="place-search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Search for a place
                  </label>
                  <PlaceSearch
                    inputId="place-search" // Pass ID to component
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search for restaurants, attractions, etc."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Search for a place to automatically fill the details below
                  </p>
                </div>

                <form onSubmit={handleAddRecommendation} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="new-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Name *
                      </label>
                      <input
                        id="new-name"
                        type="text"
                        value={newRecommendation.name}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            name: e.target.value,
                          })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-category"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Category *
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          id="new-category"
                          value={newRecommendation.category}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "manage-categories") {
                              // Open the category management modal
                              setShowCategoryModal(true);
                              // Keep the previous category selection
                              return;
                            }
                            setNewRecommendation({
                              ...newRecommendation,
                              category: value,
                            });
                          }}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          aria-label="Recommendation category"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          {(hasPermission("owner") ||
                            hasPermission("manager")) && (
                            <>
                              <option disabled className="text-gray-400">
                                ────────────────────
                              </option>
                              <option
                                value="manage-categories"
                                className="font-bold"
                              >
                                ⚙️ Manage Categories
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="new-address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address
                      </label>
                      <input
                        id="new-address"
                        type="text"
                        value={newRecommendation.address}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation address"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-website"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Website
                      </label>
                      <input
                        id="new-website"
                        type="url"
                        value={newRecommendation.website}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            website: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation website"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        id="new-phone"
                        type="text"
                        value={newRecommendation.phone_number}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation phone number"
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-rating"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Rating (1-5)
                      </label>
                      <input
                        id="new-rating"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={newRecommendation.rating}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            rating: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation rating"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="new-description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="new-description"
                        value={newRecommendation.description}
                        onChange={(e) =>
                          setNewRecommendation({
                            ...newRecommendation,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        aria-label="Recommendation description"
                        placeholder="Describe this place and why you're recommending it..."
                      ></textarea>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      {newRecommendation.images.map((image, index) => (
                        <div key={index} className="flex mb-2">
                          <input
                            id={`image-url-${index}`}
                            type="url"
                            value={image}
                            onChange={(e) => {
                              const newImages = [...newRecommendation.images];
                              newImages[index] = e.target.value;
                              setNewRecommendation({
                                ...newRecommendation,
                                images: newImages,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="https://example.com/image.jpg"
                            aria-label={`Image URL ${index + 1}`}
                          />
                          {index === newRecommendation.images.length - 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setNewRecommendation({
                                  ...newRecommendation,
                                  images: [...newRecommendation.images, ""],
                                })
                              }
                              className="ml-2 px-3 py-2 bg-blue-100 text-blue-600 rounded"
                              aria-label="Add another image URL field"
                            >
                              +
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const newImages =
                                  newRecommendation.images.filter(
                                    (_, i) => i !== index
                                  );
                                setNewRecommendation({
                                  ...newRecommendation,
                                  images: newImages,
                                });
                              }}
                              className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded"
                              aria-label="Remove this image URL field"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Recommendation
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isEditing && editingRecommendation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Edit Recommendation</h2>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditingRecommendation(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close edit dialog"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update with a new place
                      </label>
                      <PlaceSearch
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Search for a new place"
                      />
                    </div>

                    <form onSubmit={handleSaveEdit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="edit-name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Name *
                          </label>
                          <input
                            id="edit-name"
                            type="text"
                            value={editingRecommendation.name}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                name: e.target.value,
                              })
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation name"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="edit-category"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Category *
                          </label>
                          <select
                            id="edit-category"
                            value={editingRecommendation.category}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "manage-categories") {
                                setShowCategoryModal(true);
                                return;
                              }
                              setEditingRecommendation({
                                ...editingRecommendation,
                                category: value,
                              });
                            }}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation category"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            {(hasPermission("owner") ||
                              hasPermission("manager")) && (
                              <>
                                <option disabled>─────────────</option>
                                <option value="manage-categories">
                                  ⚙️ Manage Categories
                                </option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label
                            htmlFor="edit-description"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Description
                          </label>
                          <textarea
                            id="edit-description"
                            value={editingRecommendation.description || ""}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                description: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation description"
                          ></textarea>
                        </div>

                        <div>
                          <label
                            htmlFor="edit-address"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Address
                          </label>
                          <input
                            id="edit-address"
                            type="text"
                            value={editingRecommendation.address || ""}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation address"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="edit-website"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Website
                          </label>
                          <input
                            id="edit-website"
                            type="url"
                            value={editingRecommendation.website || ""}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                website: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation website"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="edit-phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Phone Number
                          </label>
                          <input
                            id="edit-phone"
                            type="text"
                            value={editingRecommendation.phone_number || ""}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                phone_number: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation phone number"
                            placeholder="(123) 456-7890"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="edit-rating"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Rating (1-5)
                          </label>
                          <input
                            id="edit-rating"
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={editingRecommendation.rating || 5}
                            onChange={(e) =>
                              setEditingRecommendation({
                                ...editingRecommendation,
                                rating: parseFloat(e.target.value) || 5,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            aria-label="Recommendation rating"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Recommendation Status
                          </label>
                          <div className="flex gap-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="edit-recommended-true"
                                checked={
                                  editingRecommendation.is_recommended !== false
                                }
                                onChange={() =>
                                  setEditingRecommendation({
                                    ...editingRecommendation,
                                    is_recommended: true,
                                  })
                                }
                                className="h-4 w-4 text-blue-600"
                                aria-label="Mark as recommended"
                              />
                              <label
                                htmlFor="edit-recommended-true"
                                className="ml-2 flex items-center gap-1"
                              >
                                <ThumbsUp
                                  size={16}
                                  className="text-green-500"
                                />
                                Recommended
                              </label>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="edit-recommended-false"
                                checked={
                                  editingRecommendation.is_recommended === false
                                }
                                onChange={() =>
                                  setEditingRecommendation({
                                    ...editingRecommendation,
                                    is_recommended: false,
                                  })
                                }
                                className="h-4 w-4 text-blue-600"
                                aria-label="Mark as not recommended"
                              />
                              <label
                                htmlFor="edit-recommended-false"
                                className="ml-2 flex items-center gap-1"
                              >
                                <ThumbsDown
                                  size={16}
                                  className="text-red-500"
                                />
                                Not Recommended
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingRecommendation(null);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded mr-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Filter by Category
                  </label>
                  {(hasPermission("owner") || hasPermission("manager")) && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Settings size={14} className="mr-1" /> Manage
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="category-filter"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full px-3 py-2 appearance-none bg-white border border-gray-300 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="capitalize"
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Status
                </label>
                <div className="relative">
                  <select
                    id="status-filter"
                    value={recommendationStatus}
                    onChange={(e) =>
                      setRecommendationStatus(
                        e.target.value as
                          | "all"
                          | "recommended"
                          | "not_recommended"
                      )
                    }
                    className="w-full px-3 py-2 appearance-none bg-white border border-gray-300 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Places</option>
                    <option value="recommended">Recommended Only</option>
                    <option value="not_recommended">
                      Not Recommended Only
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a 1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.length > 0 ? (
                  filteredRecommendations.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden relative ${
                        item.is_recommended === false
                          ? "border-2 border-red-300"
                          : ""
                      }`}
                    >
                      {item.is_recommended === false && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <ThumbsDown size={12} />
                          Not Recommended
                        </div>
                      )}

                      {(hasPermission("owner") ||
                        hasPermission("manager") ||
                        hasPermission("family")) && (
                        <button
                          onClick={() => handleDeleteRecommendation(item.id)}
                          className="absolute top-2 right-12 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full z-10"
                          aria-label="Delete recommendation"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      {(hasPermission("owner") ||
                        hasPermission("manager") ||
                        hasPermission("family")) && (
                        <button
                          onClick={() =>
                            toggleRecommendationStatus(
                              item.id,
                              item.is_recommended
                            )
                          }
                          className={`absolute top-2 right-24 p-1.5 rounded-full z-10 ${
                            item.is_recommended !== false
                              ? "bg-red-500/90 hover:bg-red-600 text-white"
                              : "bg-green-500/90 hover:bg-green-600 text-white"
                          }`}
                          aria-label={
                            item.is_recommended !== false
                              ? "Mark as not recommended"
                              : "Mark as recommended"
                          }
                        >
                          {item.is_recommended !== false ? (
                            <ThumbsDown size={16} />
                          ) : (
                            <ThumbsUp size={16} />
                          )}
                        </button>
                      )}

                      {(hasPermission("owner") ||
                        hasPermission("manager") ||
                        hasPermission("family")) && (
                        <button
                          onClick={() => handleStartEditing(item)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full z-10"
                          aria-label="Edit recommendation"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {item.images && item.images.length > 0 ? (
                        <div
                          className={`h-32 w-full relative ${
                            item.is_recommended === false ? "opacity-70" : ""
                          }`}
                        >
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            width={400}
                            height={300}
                            className="w-full h-full rounded-t-lg object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full capitalize shadow-sm">
                            {item.category}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`h-32 w-full bg-gray-200 flex items-center justify-center ${
                            item.is_recommended === false ? "opacity-70" : ""
                          }`}
                        >
                          <span className="text-gray-400 text-lg capitalize">
                            {item.category}
                          </span>
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="text-xl font-bold mb-1">{item.name}</h3>

                        {item.rating && (
                          <div className="mb-3">
                            {renderRating(item.rating)}
                          </div>
                        )}

                        {item.description && (
                          <p className="text-gray-600 text-sm mb-4">
                            {item.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          {item.address && (
                            <div className="flex items-start text-sm">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                              <span>{item.address}</span>
                            </div>
                          )}

                          {item.phone_number && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <a
                                href={`tel:${item.phone_number}`}
                                className="text-blue-600 hover:underline"
                              >
                                {item.phone_number}
                              </a>
                            </div>
                          )}

                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit Website
                            </a>
                          )}
                        </div>

                        <div className="border-t pt-3 mt-3">
                          <h4 className="font-semibold flex items-center text-sm mb-2">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Notes ({notes[item.id]?.length || 0})
                          </h4>

                          <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                            {notes[item.id]?.map((note) => (
                              <div
                                key={note.id}
                                className="text-sm bg-gray-50 p-2 rounded"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {note.user_avatar ? (
                                    <div className="flex-shrink-0 h-6 w-6 relative rounded-full overflow-hidden">
                                      <Image
                                        src={note.user_avatar}
                                        alt={note.user_name || "User avatar"}
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-800 flex-shrink-0">
                                      {note.user_name?.charAt(0) || "?"}
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {note.user_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      note.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 pl-8">
                                  {note.content}
                                </p>
                              </div>
                            ))}

                            {(!notes[item.id] ||
                              notes[item.id]?.length === 0) && (
                              <p className="text-sm text-gray-500 italic">
                                No notes yet. Be the first to add one!
                              </p>
                            )}
                          </div>

                          <div className="flex items-center mt-2">
                            <label
                              htmlFor={`note-input-${item.id}`}
                              className="sr-only"
                            >
                              Add a note for {item.name}
                            </label>
                            <input
                              id={`note-input-${item.id}`}
                              type="text"
                              placeholder="Add a note..."
                              value={newNotes[item.id] || ""}
                              onChange={(e) =>
                                setNewNotes({
                                  ...newNotes,
                                  [item.id]: e.target.value,
                                })
                              }
                              className="flex-1 text-sm border rounded-l-md py-1 px-2"
                            />
                            <button
                              onClick={() => handleAddNote(item.id)}
                              className="bg-blue-500 text-white text-sm py-1 px-3 rounded-r-md hover:bg-blue-600"
                              aria-label={`Add note to ${item.name}`}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No recommendations found for this category and status.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </AuthenticatedLayout>
  );
}
