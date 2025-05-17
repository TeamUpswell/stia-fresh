"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { Star, MapPin, ExternalLink, Phone, Plus, X, MessageSquare, ThumbsUp, ThumbsDown, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [recommendationStatus, setRecommendationStatus] = useState<"all" | "recommended" | "not_recommended">("all");
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
    is_recommended: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState<Recommendation | null>(null);
  const [newNotes, setNewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;

      setRecommendations(data || []);

      const uniqueCategories = Array.from(
        new Set(data?.map(item => item.category) || [])
      );

      setCategories(uniqueCategories);

      fetchNotes(data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (recommendations: Recommendation[]) => {
    if (recommendations.length === 0) return;

    try {
      const recIds = recommendations.map(rec => rec.id);
      const { data: notesData, error: notesError } = await supabase
        .from("recommendation_notes")
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
        `)
        .in("recommendation_id", recIds)
        .order("created_at", { ascending: false });

      if (!notesError && notesData) {
        const groupedNotes: Record<string, RecommendationNote[]> = {};
        notesData.forEach(note => {
          if (!groupedNotes[note.recommendation_id]) {
            groupedNotes[note.recommendation_id] = [];
          }

          const formattedNote = {
            ...note,
            user_name: note.profiles?.full_name || "Anonymous User",
            user_avatar: note.profiles?.avatar_url
          };

          groupedNotes[note.recommendation_id].push(formattedNote);
        });

        setNotes(groupedNotes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesCategory = activeCategory === "all" || rec.category === activeCategory;

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

    try {
      const { data, error } = await supabase
        .from("recommendations")
        .insert([{
          ...newRecommendation,
          images: newRecommendation.images.filter(img => img.trim() !== "")
        }])
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
        is_recommended: true
      });

      fetchRecommendations();
    } catch (error) {
      console.error("Error adding recommendation:", error);
      toast.error("Failed to add recommendation");
    }
  };

  const handleStartEditing = (recommendation: Recommendation) => {
    if (!hasPermission("owner") && !hasPermission("manager") && !hasPermission("family")) {
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
          is_recommended: editingRecommendation.is_recommended
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

  const toggleRecommendationStatus = async (id: string, currentStatus: boolean | undefined) => {
    if (!hasPermission("owner") && !hasPermission("manager") && !hasPermission("family")) {
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

      toast.success(`Marked as ${newStatus ? "Recommended" : "Not Recommended"}`);

      setRecommendations(recommendations.map(rec =>
        rec.id === id ? { ...rec, is_recommended: newStatus } : rec
      ));
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleAddNote = async (recommendationId: string) => {
    if (!user) {
      toast.error("You must be logged in to add notes");
      return;
    }

    const noteContent = newNotes[recommendationId];
    if (!noteContent || noteContent.trim() === "") {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("recommendation_notes")
        .insert([{
          recommendation_id: recommendationId,
          user_id: user.id,
          content: noteContent
        }])
        .select();

      if (error) throw error;

      toast.success("Note added!");

      setNewNotes({
        ...newNotes,
        [recommendationId]: ""
      });

      const { data: updatedRecs } = await supabase
        .from("recommendations")
        .select("*");

      if (updatedRecs) {
        fetchNotes(updatedRecs);
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 half-filled" />);
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

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Local Recommendations</h1>
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

          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Add New Recommendation</h2>
              <form onSubmit={handleAddRecommendation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newRecommendation.name}
                      onChange={(e) => setNewRecommendation({...newRecommendation, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      value={newRecommendation.category}
                      onChange={(e) => setNewRecommendation({...newRecommendation, category: e.target.value})}
                      required
                      placeholder="restaurants, activities, shopping, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={newRecommendation.address}
                      onChange={(e) => setNewRecommendation({...newRecommendation, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newRecommendation.website}
                      onChange={(e) => setNewRecommendation({...newRecommendation, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={newRecommendation.phone_number}
                      onChange={(e) => setNewRecommendation({...newRecommendation, phone_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newRecommendation.rating}
                      onChange={(e) => setNewRecommendation({...newRecommendation, rating: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newRecommendation.description}
                      onChange={(e) => setNewRecommendation({...newRecommendation, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    {newRecommendation.images.map((image, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...newRecommendation.images];
                            newImages[index] = e.target.value;
                            setNewRecommendation({...newRecommendation, images: newImages});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="https://example.com/image.jpg"
                        />
                        {index === newRecommendation.images.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setNewRecommendation({
                              ...newRecommendation, 
                              images: [...newRecommendation.images, ""]
                            })}
                            className="ml-2 px-3 py-2 bg-blue-100 text-blue-600 rounded"
                          >
                            +
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = newRecommendation.images.filter((_, i) => i !== index);
                              setNewRecommendation({...newRecommendation, images: newImages});
                            }}
                            className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded"
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
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={editingRecommendation.name}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, name: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <input
                          type="text"
                          value={editingRecommendation.category}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, category: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={editingRecommendation.description || ""}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, description: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={editingRecommendation.address || ""}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input
                          type="url"
                          value={editingRecommendation.website || ""}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, website: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editingRecommendation.phone_number || ""}
                          onChange={(e) => setEditingRecommendation({...editingRecommendation, phone_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={editingRecommendation.rating || 5}
                          onChange={(e) => setEditingRecommendation({
                            ...editingRecommendation, 
                            rating: parseFloat(e.target.value) || 5
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Recommendation Status</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={editingRecommendation.is_recommended !== false}
                              onChange={() => setEditingRecommendation({...editingRecommendation, is_recommended: true})}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="flex items-center gap-1">
                              <ThumbsUp size={16} className="text-green-500" />
                              Recommended
                            </span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={editingRecommendation.is_recommended === false}
                              onChange={() => setEditingRecommendation({...editingRecommendation, is_recommended: false})}
                              className="h-4 w-4 text-blue-600"
                            />
                            <span className="flex items-center gap-1">
                              <ThumbsDown size={16} className="text-red-500" />
                              Not Recommended
                            </span>
                          </label>
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

          <div className="mb-8 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Filter by Category:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeCategory === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  All Categories
                </button>

                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                      activeCategory === category
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Filter by Status:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRecommendationStatus("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    recommendationStatus === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  All Places
                </button>

                <button
                  onClick={() => setRecommendationStatus("recommended")}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${
                    recommendationStatus === "recommended"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <ThumbsUp size={14} />
                  Recommended
                </button>

                <button
                  onClick={() => setRecommendationStatus("not_recommended")}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 ${
                    recommendationStatus === "not_recommended"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <ThumbsDown size={14} />
                  Not Recommended
                </button>
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
                filteredRecommendations.map(item => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-lg shadow-md overflow-hidden relative ${
                      item.is_recommended === false ? 'border-2 border-red-300' : ''
                    }`}
                  >
                    {item.is_recommended === false && (
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ThumbsDown size={12} />
                        Not Recommended
                      </div>
                    )}

                    {(hasPermission("owner") || hasPermission("manager") || hasPermission("family")) && (
                      <button
                        onClick={() => handleStartEditing(item)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full z-10"
                        aria-label="Edit recommendation"
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    {(hasPermission("owner") || hasPermission("manager") || hasPermission("family")) && (
                      <button
                        onClick={() => toggleRecommendationStatus(item.id, item.is_recommended)}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-full z-10 ${
                          item.is_recommended !== false 
                            ? 'bg-red-500/90 hover:bg-red-600 text-white' 
                            : 'bg-green-500/90 hover:bg-green-600 text-white'
                        }`}
                        aria-label={item.is_recommended !== false ? "Mark as not recommended" : "Mark as recommended"}
                      >
                        {item.is_recommended !== false ? <ThumbsDown size={16} /> : <ThumbsUp size={16} />}
                      </button>
                    )}

                    {(item.images && item.images.length > 0) ? (
                      <div className={`h-48 w-full relative ${item.is_recommended === false ? 'opacity-70' : ''}`}>
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-gray-900/70 text-white text-xs px-2 py-1 rounded-full capitalize">
                          {item.category}
                        </div>
                      </div>
                    ) : (
                      <div className={`h-48 w-full bg-gray-200 flex items-center justify-center ${item.is_recommended === false ? 'opacity-70' : ''}`}>
                        <span className="text-gray-400 text-lg capitalize">{item.category}</span>
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>

                      {item.rating && (
                        <div className="mb-3">{renderRating(item.rating)}</div>
                      )}

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
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
                            <a href={`tel:${item.phone_number}`} className="text-blue-600 hover:underline">
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
                          {notes[item.id]?.map(note => (
                            <div key={note.id} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                {note.user_avatar ? (
                                  <img 
                                    src={note.user_avatar} 
                                    alt={note.user_name} 
                                    className="h-6 w-6 rounded-full"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-800">
                                    {note.user_name?.charAt(0) || "?"}
                                  </div>
                                )}
                                <span className="font-medium">{note.user_name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(note.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 pl-8">{note.content}</p>
                            </div>
                          ))}

                          {(!notes[item.id] || notes[item.id]?.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No notes yet. Be the first to add one!</p>
                          )}
                        </div>

                        <div className="flex items-center mt-2">
                          <input
                            type="text"
                            placeholder="Add a note..."
                            value={newNotes[item.id] || ""}
                            onChange={(e) => setNewNotes({...newNotes, [item.id]: e.target.value})}
                            className="flex-1 text-sm border rounded-l-md py-1 px-2"
                          />
                          <button
                            onClick={() => handleAddNote(item.id)}
                            className="bg-blue-500 text-white text-sm py-1 px-3 rounded-r-md hover:bg-blue-600"
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
    </AuthenticatedLayout>
  );
}
