"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTenant } from "./useTenant";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "../supabase";

interface Property {
  id: string;
  name: string;
  address?: string;
  tenant_id: string;
  [key: string]: any;
}

interface PropertyContextType {
  currentProperty: Property | null;
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  switchProperty: (propertyId: string) => void;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { userTenants, isLoading: tenantLoading } = useTenant();
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async () => {
    if (!user || !userTenants.length || authLoading || tenantLoading) {
      setProperties([]);
      setCurrentProperty(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const tenantIds = userTenants.map(tenant => tenant.id);
      
      console.log("Loading properties for user tenants:", tenantIds);
      
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Loaded properties:", data);
      setProperties(data || []);
      
      if ((data || []).length > 0 && !currentProperty) {
        const firstProperty = data[0];
        setCurrentProperty(firstProperty);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentPropertyId', firstProperty.id);
        }
      }
      
      if (typeof window !== 'undefined') {
        const savedPropertyId = localStorage.getItem('currentPropertyId');
        if (savedPropertyId) {
          const savedProperty = (data || []).find(p => p.id === savedPropertyId);
          if (savedProperty) {
            setCurrentProperty(savedProperty);
          } else if ((data || []).length > 0) {
            setCurrentProperty(data[0]);
            localStorage.setItem('currentPropertyId', data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Error loading properties:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const switchProperty = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentPropertyId', propertyId);
      }
      console.log("Switched to property:", property.name);
    }
  };

  useEffect(() => {
    // Only load when auth and tenant loading are complete
    if (!authLoading && !tenantLoading && userTenants.length > 0) {
      loadProperties();
    }
  }, [userTenants, user, authLoading, tenantLoading]);

  return (
    <PropertyContext.Provider
      value={{
        currentProperty,
        properties,
        isLoading: isLoading || authLoading || tenantLoading,
        error,
        switchProperty,
        refreshProperties: loadProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    // Return safe defaults during SSR
    if (typeof window === 'undefined') {
      return {
        currentProperty: null,
        properties: [],
        isLoading: true,
        error: null,
        switchProperty: () => {},
        refreshProperties: async () => {},
      };
    }
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}