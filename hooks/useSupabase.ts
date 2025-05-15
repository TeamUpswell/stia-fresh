import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";

export interface SupabaseState<T> {
  data: T[];
  loading: boolean;
  error: PostgrestError | null;
  fetchData: () => Promise<void>;
  addItem: (item: Omit<T, "id">) => Promise<void>;
  updateItem: (id: string | number, updates: Partial<T>) => Promise<void>;
  deleteItem: (id: string | number) => Promise<void>;
}

export function useSupabase<T>(table: string): SupabaseState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from(table).select("*");

      if (error) {
        setError(error);
        return;
      }

      setData(data || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<T, "id">) => {
    try {
      setLoading(true);
      const { error } = await supabase.from(table).insert([item]);

      if (error) {
        setError(error);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error(`Error adding to ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string | number, updates: Partial<T>) => {
    try {
      setLoading(true);
      const { error } = await supabase.from(table).update(updates).eq("id", id);

      if (error) {
        setError(error);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string | number) => {
    try {
      setLoading(true);
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        setError(error);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    fetchData,
    addItem,
    updateItem,
    deleteItem,
  };
}
