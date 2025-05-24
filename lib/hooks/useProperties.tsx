"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "./useTenant";

export function useProperties() {
  const { currentTenant } = useTenant();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProperties = async () => {
    if (!currentTenant) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("tenant_id", currentTenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error("Error loading properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [currentTenant]);

  return {
    properties,
    loading,
    error,
    reload: loadProperties,
  };
}