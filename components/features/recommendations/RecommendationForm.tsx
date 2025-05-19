/// <reference types="@types/google.maps" />
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Script from "next/script";
import styles from "./RecommendationForm.module.css";

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
}

interface RecommendationFormProps {
  recommendation: Recommendation | null;
  categories: string[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function RecommendationForm({
  recommendation,
  categories,
  onSave,
  onCancel,
}: RecommendationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: categories[0] || "Restaurant",
    address: "",
    description: "",
    rating: 0,
    website: "",
    phone_number: "",
    images: [""],
    coordinates: null as { lat: number; lng: number } | null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [searchResultsVisible, setSearchResultsVisible] = useState(false);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Add ref for search service
  const searchService = useRef<google.maps.places.AutocompleteService | null>(null);

  // Add a debounced search to prevent excessive API calls
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  // Add ref for search timeout
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services when script is loaded
  useEffect(() => {
    if (googleLoaded && mapRef.current) {
      // Create a dummy map element for PlacesService (required by API)
      const map = new google.maps.Map(mapRef.current);

      // Initialize Places services
      searchService.current = new google.maps.places.AutocompleteService();
      placesService.current = new google.maps.places.PlacesService(map);
    }
  }, [googleLoaded]);

  // Populate form with recommendation data if editing
  useEffect(() => {
    if (recommendation) {
      setFormData({
        name: recommendation.name || "",
        category: recommendation.category || categories[0],
        address: recommendation.address || "",
        description: recommendation.description || "",
        rating: recommendation.rating || 0,
        website: recommendation.website || "",
        phone_number: recommendation.phone_number || "",
        images: recommendation.images?.length ? recommendation.images : [""],
        coordinates: recommendation.coordinates || null,
      });
    }
  }, [recommendation, categories]);

  // Handle search query changes
  useEffect(() => {
    handleSearch();
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // Wrap handleSearch with useCallback
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Add null check before clearing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (data && data.results) {
          setSearchResults(data.results);
        }
      } catch (error) {
        console.error("Error searching places:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchQuery, setSearchResults, setIsSearching]);

  // Update search input onChange handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear any previous debounced search
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    // Debounce search to avoid excessive API calls
    debouncedSearch.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);
  };

  // Handle selecting a place from search results
  const handlePlaceSelect = (placeId: string) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "website",
          "formatted_phone_number",
          "rating",
          "photos",
          "types",
        ],
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          return;
        }

        // Auto-select category based on place types
        let category = formData.category;
        if (place.types) {
          if (
            place.types.includes("restaurant") ||
            place.types.includes("food")
          ) {
            category = "Restaurant";
          } else if (
            place.types.includes("park") ||
            place.types.includes("natural_feature")
          ) {
            category = "Hike";
          } else if (
            place.types.includes("store") ||
            place.types.includes("shopping_mall")
          ) {
            category = "Shopping";
          } else if (place.types.includes("beach")) {
            category = "Beach";
          }
        }

        // Update form data with place details
        setFormData({
          name: place.name || "",
          category: categories.includes(category)
            ? category
            : formData.category,
          address: place.formatted_address || "",
          description: formData.description,
          rating: place.rating || 0,
          website: place.website || "",
          phone_number: place.formatted_phone_number || "",
          images:
            place.photos && place.photos.length > 0
              ? [place.photos[0].getUrl({ maxWidth: 1000, maxHeight: 1000 })]
              : formData.images,
          coordinates: place.geometry?.location
            ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }
            : null,
        });

        // Clear search
        setSearchQuery("");
        setSearchResults([]);
        setSearchResultsVisible(false);
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const removeImageField = (index: number) => {
    if (formData.images.length <= 1) return;

    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty image URLs
    const filteredImages = formData.images.filter((url) => url.trim() !== "");

    // Send form data with coordinates if available
    onSave({
      ...formData,
      images: filteredImages.length ? filteredImages : null,
      rating: formData.rating || null,
    });
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setGoogleLoaded(true)}
      />

      {/* Hidden div for PlacesService (requires a DOM element) */}
      <div ref={mapRef} className={styles.hiddenMapRef}></div>

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold">
              {recommendation ? "Edit Recommendation" : "Add Recommendation"}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close recommendation form"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Place Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search for a Place
              </label>
              <div className="relative">
                <div className={styles.searchIcon}>
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search for places..."
                  className={styles.searchInput}
                  onFocus={() =>
                    searchResults.length > 0 && setSearchResultsVisible(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setSearchResultsVisible(false), 200)
                  }
                />
                {isSearching && (
                  <div className={styles.searchSpinner}>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchResultsVisible && searchResults.length > 0 && (
                <div
                  className={`${styles.resultDropdown} bg-white shadow-lg rounded-md py-1`}
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => handlePlaceSelect(result.place_id!)}
                      className="w-full text-left cursor-pointer hover:bg-gray-100 px-4 py-2 border-0 bg-transparent"
                      aria-label={`Select ${result.name}`}
                      title={`${result.name} - ${result.formatted_address}`}
                    >
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-500">
                        {result.formatted_address}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1 text-sm text-gray-500">
                Search for a place to automatically fill in details, or enter
                them manually below.
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full address for Google Maps"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label
                htmlFor="rating"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rating (1-5)
              </label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
                min="0"
                max="5"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Website */}
            <div className="mb-4">
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Images */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>

              {formData.images.map((image, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addImageField}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                + Add another image
              </button>
            </div>

            {/* Preview Map */}
            {formData.coordinates && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Map Preview
                </label>
                <div className="rounded-md overflow-hidden border border-gray-300 h-40">
                  <iframe
                    width="100%"
                    height="100%"
                    className={styles.mapIframe}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${formData.coordinates.lat},${formData.coordinates.lng}`}
                  ></iframe>
                </div>
              </div>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
              >
                {recommendation ? "Update" : "Add"} Recommendation
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
