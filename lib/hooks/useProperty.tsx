"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTenant } from "./useTenant";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "../supabase";

interface Property {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  tenant_id: string;
  [key: string]: any;
}

interface PropertyContextType {
  currentProperty: Property | null;
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  switchProperty: (property: Property) => void;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const { user, loading: authLoading } = useAuth();
  
  // Add this debug log
  console.log("🏠 PropertyProvider Debug:", {
    user: user?.id,
    currentTenant: currentTenant?.id,
    currentTenantName: currentTenant?.name,
    tenantLoading,
    authLoading,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async () => {
    // ✅ Fix: Check for currentTenant instead of tenants array
    if (!user || !currentTenant || authLoading || tenantLoading) {
      console.log("🏠 Not loading properties - missing requirements:", {
        user: !!user,
        currentTenant: !!currentTenant,
        authLoading,
        tenantLoading
      });
      setProperties([]);
      setCurrentProperty(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // ✅ Fix: Use currentTenant.id directly
      console.log("🏠 Loading properties for current tenant:", currentTenant.id);
      
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("tenant_id", currentTenant.id) // ✅ Use single tenant
        .order("created_at", { ascending: false });

      console.log("🏠 Properties fetch result:", data, error);

      if (error) throw error;

      console.log("🏠 Loaded properties:", data);
      setProperties(data || []);
      
      // ✅ Handle current property selection
      if ((data || []).length > 0) {
        // Check localStorage first
        let selectedProperty = null;
        if (typeof window !== 'undefined') {
          const savedPropertyId = localStorage.getItem('currentPropertyId');
          if (savedPropertyId) {
            selectedProperty = (data || []).find(p => p.id === savedPropertyId);
          }
        }
        
        // Fall back to first property if no saved selection
        if (!selectedProperty) {
          selectedProperty = data[0];
        }
        
        setCurrentProperty(selectedProperty);
        console.log("🏠 Set current property:", selectedProperty.name);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentPropertyId', selectedProperty.id);
        }
      } else {
        setCurrentProperty(null);
      }

    } catch (err) {
      console.error("🔴 Error loading properties:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const switchProperty = (property: Property) => {
    setCurrentProperty(property);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPropertyId', property.id);
    }
    console.log("🏠 Switched to property:", property.name);
  };

  // ✅ Fix: Depend on currentTenant instead of tenants
  useEffect(() => {
    if (user && !authLoading && !tenantLoading && currentTenant) {
      loadProperties();
    }
  }, [user, authLoading, tenantLoading, currentTenant]); // ✅ Updated dependency

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

export function usePropertyContext() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
}

// For backwards compatibility
export function useProperty() {
  return usePropertyContext();
}

// Export the context for direct access if needed
export { PropertyContext };