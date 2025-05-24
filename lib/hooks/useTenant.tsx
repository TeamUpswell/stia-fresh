"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider"; // Import directly from AuthProvider
import { supabase } from "../supabase";

interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserTenants = async () => {
    if (!user) {
      setUserTenants([]);
      setCurrentTenant(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading tenants for user:", user.id);

      const { data, error } = await supabase
        .from("tenant_users")
        .select(`
          tenant_id,
          role,
          status,
          tenants (
            id,
            name,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      const tenants = data
        ?.map(item => item.tenants)
        .filter(Boolean) as Tenant[];

      console.log("Loaded tenants:", tenants);
      setUserTenants(tenants || []);

      // Set current tenant if none selected
      if (!currentTenant && tenants && tenants.length > 0) {
        const savedTenantId = typeof window !== 'undefined' 
          ? localStorage.getItem('currentTenantId') 
          : null;
        
        const tenantToSelect = savedTenantId 
          ? tenants.find(t => t.id === savedTenantId) || tenants[0]
          : tenants[0];
        
        setCurrentTenant(tenantToSelect);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentTenantId', tenantToSelect.id);
        }
      }
    } catch (err) {
      console.error("Error loading tenants:", err);
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const switchTenant = (tenantId: string) => {
    const tenant = userTenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentTenantId', tenantId);
      }
      console.log("Switched to tenant:", tenant.name);
    }
  };

  useEffect(() => {
    // Only load tenants when auth is not loading and we have a user
    if (!authLoading) {
      loadUserTenants();
    }
  }, [user, authLoading]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        userTenants,
        isLoading: isLoading || authLoading,
        error,
        switchTenant,
        refreshTenants: loadUserTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    // Return safe defaults during SSR
    if (typeof window === 'undefined') {
      return {
        currentTenant: null,
        userTenants: [],
        isLoading: true,
        error: null,
        switchTenant: () => {},
        refreshTenants: async () => {},
      };
    }
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
