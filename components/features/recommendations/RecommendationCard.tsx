"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  StarIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

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

// Add a new prop for permission checks
interface RecommendationCardProps {
  recommendation: Recommendation;
  showEditControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function RecommendationCard({
  recommendation,
  showEditControls = false,
  onEdit,
  onDelete,
}: RecommendationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getMapUrl = () => {
    if (recommendation.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${recommendation.coordinates.lat},${recommendation.coordinates.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      recommendation.address
    )}`;
  };

  const getCategoryColor = () => {
    switch (recommendation.category) {
      case "Restaurant":
        return "bg-red-100 text-red-800";
      case "Hike":
        return "bg-green-100 text-green-800";
      case "Activity":
        return "bg-purple-100 text-purple-800";
      case "Shopping":
        return "bg-yellow-100 text-yellow-800";
      case "Beach":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRating = () => {
    if (!recommendation.rating) return null;

    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i < recommendation.rating
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300"
          }`}
        />
      );
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm text-gray-600">
          {recommendation.rating}/5
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {recommendation.images && recommendation.images.length > 0 ? (
          recommendation.images[0].includes("googleapis.com") ? (
            // Use regular img tag for Google Maps images
            <img
              src={recommendation.images[0]}
              alt={recommendation.name}
              className="w-full h-full object-cover"
            />
          ) : (
            // Use Next/Image for other images
            <Image
              src={recommendation.images[0]}
              alt={recommendation.name}
              fill
              style={{ objectFit: "cover" }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPinIcon className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor()}`}
          >
            {recommendation.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-1">{recommendation.name}</h3>
          {renderRating()}
        </div>

        {/* Address with Google Maps Link */}
        <a
          href={getMapUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start mt-3 text-gray-600 hover:text-blue-600 group"
        >
          <MapPinIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 group-hover:text-blue-600" />
          <span>{recommendation.address}</span>
          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Website if available */}
        {recommendation.website && (
          <a
            href={
              recommendation.website.startsWith("http")
                ? recommendation.website
                : `https://${recommendation.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center mt-2 text-gray-600 hover:text-blue-600 group"
          >
            <GlobeAltIcon className="h-5 w-5 mr-2 group-hover:text-blue-600" />
            <span>Website</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}

        {/* Phone if available */}
        {recommendation.phone_number && (
          <a
            href={`tel:${recommendation.phone_number.replace(/\D/g, "")}`}
            className="flex items-center mt-2 text-gray-600 hover:text-blue-600"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            <span>{recommendation.phone_number}</span>
          </a>
        )}

        {/* Description */}
        <p className="mt-4 text-gray-600">{recommendation.description}</p>

        {/* Map */}
        <div className="mt-4 rounded-md overflow-hidden border border-gray-300">
          <iframe
            width="100%"
            height="150"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            }&q=${encodeURIComponent(recommendation.address)}`}
          ></iframe>
        </div>

        {/* Action Buttons */}
        {showEditControls && (
          <div className="mt-4 flex justify-end space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-blue-500"
                title="Edit"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-500"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
