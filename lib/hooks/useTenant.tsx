"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Tenant, TenantContextType } from "@/lib/types/tenant";

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  userTenants: [],
  isLoading: true,
  error: null,
  switchTenant: async () => {},
  createTenant: async () => ({} as Tenant),
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserTenants();
    } else {
      setCurrentTenant(null);
      setUserTenants([]);
      setIsLoading(false);
    }
  }, [user]);

  async function loadUserTenants() {
    try {
      setIsLoading(true);
      console.log("Loading tenants for user:", user?.id);

      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("user_id", user?.id);

      if (tenantUsersError) {
        console.error("Error loading tenant_users:", tenantUsersError);
        throw tenantUsersError;
      }

      console.log("Found tenant_users:", tenantUsers);

      if (!tenantUsers || tenantUsers.length === 0) {
        console.log("No tenants found for user, creating default tenant...");
        await createDefaultTenant();
        return;
      }

      // Now get the tenant details
      const tenantIds = tenantUsers.map((tu) => tu.tenant_id);
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .in("id", tenantIds);

      if (tenantsError) {
        console.error("Error loading tenants:", tenantsError);
        throw tenantsError;
      }

      console.log("Found tenants:", tenants);
      setUserTenants(tenants || []);

      // Set current tenant
      const savedTenantId = localStorage.getItem("currentTenantId");
      let currentTenant =
        tenants?.find((t) => t.id === savedTenantId) || tenants?.[0] || null;

      setCurrentTenant(currentTenant);
      if (currentTenant) {
        localStorage.setItem("currentTenantId", currentTenant.id);
      }
    } catch (err) {
      console.error("Error in loadUserTenants:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load tenants")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function createDefaultTenant() {
    try {
      if (!user?.id) {
        throw new Error("No user ID available");
      }

      console.log("Creating default tenant for user:", user.id);

      // Generate a unique slug from email or user ID
      const userEmail = user.email || `user-${user.id}`;
      const baseSlug = userEmail
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      const slug = `${baseSlug}-${Date.now()}`; // Add timestamp to ensure uniqueness

      const tenantData = {
        name: `${userEmail.split("@")[0] || "User"}'s Properties`,
        slug: slug,
        owner_user_id: user.id,
        plan: "starter", // Optional since it has a default
        status: "active", // Optional since it has a default
      };

      console.log("Creating tenant with data:", tenantData);

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert([tenantData])
        .select()
        .single();

      console.log("Tenant creation result:", { tenant, tenantError });

      if (tenantError) {
        console.error("Tenant creation error:", tenantError);
        throw tenantError;
      }

      // Create tenant_user relationship
      const { error: tenantUserError } = await supabase
        .from("tenant_users")
        .insert([
          {
            tenant_id: tenant.id,
            user_id: user.id,
            role: "owner",
            status: "active",
          },
        ]);

      console.log("Tenant user creation result:", { tenantUserError });

      if (tenantUserError) {
        console.error("Tenant user creation error:", tenantUserError);
        throw tenantUserError;
      }

      // Reload tenants
      await loadUserTenants();
    } catch (error) {
      console.error("Error creating default tenant:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to create tenant")
      );
    }
  }

  async function switchTenant(tenantId: string) {
    const tenant = userTenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem("currentTenantId", tenantId);
    }
  }

  async function createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .insert([
          {
            ...tenantData,
            owner_user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add user as owner
      await supabase.from("tenant_users").insert([
        {
          tenant_id: data.id,
          user_id: user?.id,
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
        },
      ]);

      await loadUserTenants();
      return data;
    } catch (err) {
      throw err;
    }
  }

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        userTenants,
        isLoading,
        error,
        switchTenant,
        createTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
