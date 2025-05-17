"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address: string;
  zoom?: number;
}

export default function GoogleMapComponent({
  latitude,
  longitude,
  address,
  zoom = 15,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      // Replace with your actual API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        return;
      }

      const loader = new Loader({
        apiKey,
        version: "weekly",
      });

      try {
        const google = await loader.load();
        const position = { lat: latitude, lng: longitude };
        
        const mapOptions = {
          center: position,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        };

        const map = new google.maps.Map(mapRef.current, mapOptions);
        const marker = new google.maps.Marker({
          position,
          map,
          title: address,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px;"><strong>${address}</strong></div>`,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, [latitude, longitude, address, zoom]);

  return (
    <div className="w-full h-full">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          Loading map...
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ minHeight: "100%", position: "relative" }}
      />
    </div>
  );
}