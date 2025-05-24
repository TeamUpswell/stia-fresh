"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import SideNavigation from "@/components/layout/SideNavigation";
import { supabase } from "@/lib/supabase";

const uploadDocument = async (file: File, documentName: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${documentName}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(fileName, file, {
      cacheControl: "31536000", // 1 year for static documents
      upsert: true,
    });

  if (error) {
    throw new Error(`Error uploading document: ${error.message}`);
  }

  return fileName;
};

// Make sure this is a function component that returns JSX
export default function DocumentsPage() {
  const { user } = useAuth();

  // Your state and hooks here
  const [documents, setDocuments] = useState([]);

  // Make sure there's a return statement with JSX
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Documents
              </h1>
            </div>
            {/* Your documents content here */}
          </div>
        </main>
      </div>
    </div>
  );
}
