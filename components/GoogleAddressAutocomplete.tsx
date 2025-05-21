'use client';

import { useState, useEffect, useRef } from 'react';

interface GoogleAddressAutocompleteProps {
  onAddressSelect: (addressComponents: {
    formattedAddress: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
  className?: string;
  placeholder?: string;
}

export default function GoogleAddressAutocomplete({
  onAddressSelect,
  className = '',
  placeholder = 'Enter an address...'
}: GoogleAddressAutocompleteProps) {
  const containerRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !window.google?.maps?.places) return;

    try {
      // Use the legacy Autocomplete API since PlaceAutocompleteElement is causing issues
      const autocomplete = new google.maps.places.Autocomplete(containerRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry']
      });
      
      // Add event listener for place selection
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place || !place.address_components) {
          console.warn('No address components found in selected place');
          return;
        }
        
        // Parse address components
        const addressComponents: Record<string, string> = {};
        
        place.address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            addressComponents.street_number = component.long_name;
          } else if (types.includes('route')) {
            addressComponents.route = component.long_name;
          } else if (types.includes('locality')) {
            addressComponents.locality = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            addressComponents.administrative_area_level_1 = component.short_name;
          } else if (types.includes('postal_code')) {
            addressComponents.postal_code = component.long_name;
          } else if (types.includes('country')) {
            addressComponents.country = component.long_name;
          }
        });
        
        // Build street address
        const street = `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim();
        
        // Call the callback
        onAddressSelect({
          formattedAddress: place.formatted_address || '',
          street,
          city: addressComponents.locality || '',
          state: addressComponents.administrative_area_level_1 || '',
          zip: addressComponents.postal_code || '',
          country: addressComponents.country || '',
          latitude: place.geometry?.location?.lat() || 0,
          longitude: place.geometry?.location?.lng() || 0
        });
      });

      // Clean up
      return () => {
        if (google.maps.event) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error("Error initializing Google Places:", error);
    }
  }, [onAddressSelect]);

  return (
    <input
      ref={containerRef}
      type="text"
      placeholder={placeholder}
      className={`${className} w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
    />
  );
}