"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DatabaseDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<{
    connection: boolean;
    tables: Record<string, boolean>;
    error?: string;
    loading: boolean;
  }>({
    connection: false,
    tables: {},
    loading: true,
  });

  useEffect(() => {
    async function runDiagnostics() {
      try {
        // Test 1: Basic connection - FIXED VERSION
        let connectionError;
        try {
          // Try to query a non-existent table (this will fail with a specific error code)
          const result = await supabase
            .from("_dummy_query_")
            .select("*")
            .limit(1);
          connectionError = result.error;
        } catch (err) {
          // Handle unexpected errors
          connectionError = { message: "Connection failed", code: "UNEXPECTED" };
        }

        // If we get PGRST116, that means the database connection works but the table doesn't exist
        // which is exactly what we expect for a dummy query
        const isConnected = !connectionError || connectionError.code === "PGRST116";

        // Test 2: Check expected tables exist
        const expectedTables = [
          "manual_sections",
          "manual_items",
          "user_roles",
          "contacts",
          "checklists",
          "checklist_items",
        ];

        const tableResults: Record<string, boolean> = {};

        // Check each table
        for (const table of expectedTables) {
          const { error } = await supabase.from(table).select("count").limit(0);
          tableResults[table] = !error;
        }

        setDiagnosticResults({
          connection: isConnected,
          tables: tableResults,
          loading: false,
        });
      } catch (error) {
        setDiagnosticResults({
          connection: false,
          tables: {},
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        });
      }
    }

    runDiagnostics();
  }, []);

  if (diagnosticResults.loading) {
    return <div className="text-sm text-gray-500">Running database diagnostics...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-w-md">
      <h2 className="text-lg font-medium mb-3">Database Diagnostic Results</h2>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div
            className={`h-3 w-3 rounded-full mr-2 ${
              diagnosticResults.connection ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            Database Connection: {diagnosticResults.connection ? "OK" : "Failed"}
          </span>
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-medium mb-1">Tables:</h3>
          <ul className="space-y-1">
            {Object.entries(diagnosticResults.tables).map(([table, exists]) => (
              <li key={table} className="flex items-center text-xs">
                <div
                  className={`h-2 w-2 rounded-full mr-2 ${
                    exists ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>
                  {table}: {exists ? "Exists" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {diagnosticResults.error && (
          <div className="text-red-500 text-xs mt-2">
            Error: {diagnosticResults.error}
          </div>
        )}
      </div>
    </div>
  );
}