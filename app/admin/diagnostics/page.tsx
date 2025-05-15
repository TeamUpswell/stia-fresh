"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DatabaseDiagnostic from "@/components/debug/DatabaseDiagnostic";
import { useAuth } from "@/components/AuthProvider";

export default function DiagnosticsPage() {
  const [config, setConfig] = useState({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
    keyIsMasked: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Diagnostics</h1>

      <div className="space-y-8">
        <section className="bg-white p-5 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">
            Environment Configuration
          </h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Supabase URL: </span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {config.supabaseUrl}
              </code>
            </div>
            <div>
              <span className="font-medium">Supabase Key: </span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {config.keyIsMasked ? "Is set (masked)" : "Not set"}
              </code>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Database Diagnostics</h2>
          <DatabaseDiagnostic />
        </section>
      </div>
    </div>
  );
}
