"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { PlusIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import ChecklistCard from "@/components/features/checklists/ChecklistCard";
import ChecklistForm from "@/components/features/checklists/ChecklistForm";
import { useLoadingTimeout } from "@/hooks/useLoadingTimeout";

interface Checklist {
  id: string;
  title: string;
  description: string;
  property_id: string;
  created_at: string;
}

export default function ChecklistsPage() {
  const { user, hasPermission } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update this line to include setTimedOut
  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  // Fetch checklists
  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error) {
      console.error("Error fetching checklists:", error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setChecklists]);

  useEffect(() => {
    if (user) {
      fetchChecklists();
    }
  }, [user, fetchChecklists]);

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="family"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Sorry, you need family member permissions to access checklists.
            </p>
          </div>
        }
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Checklists</h1>

              {hasPermission("manager") && (
                <button
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => setShowAddForm(true)}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Checklist
                </button>
              )}
            </div>

            {loading && !timedOut ? (
              <div>Loading...</div>
            ) : timedOut ? (
              <div className="text-center p-8">
                <p className="text-red-500">Loading timed out</p>
                <p className="text-gray-600 mt-1">
                  There might be an issue connecting to the database.
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={() => {
                    setTimedOut(false);
                    setLoading(true);
                    fetchChecklists();
                  }}
                >
                  Retry
                </button>
                <button
                  className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                  onClick={() => (window.location.href = "/admin/diagnostics")}
                >
                  Run Diagnostics
                </button>
              </div>
            ) : checklists.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No checklists found</p>
                {hasPermission("manager") && (
                  <p className="text-gray-500 text-sm mt-2">
                    Create your first checklist to get started
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklists.map((checklist) => (
                  <ChecklistCard
                    key={checklist.id}
                    checklist={checklist}
                    onDelete={
                      hasPermission("manager") ? fetchChecklists : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Checklist Form */}
        {showAddForm && (
          <ChecklistForm
            onClose={() => setShowAddForm(false)}
            onSaved={fetchChecklists}
          />
        )}
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
