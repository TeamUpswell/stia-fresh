"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user } = useAuth();

  // Type the file parameter properly
  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "604800", // 1 week for avatars (they change more often)
        upsert: true,
      });

    // Rest of your function...
    if (error) {
      console.error("Error uploading avatar:", error.message);
      return false;
    }

    return true;
  };

  // Rest of your component logic...

  return (
    // Your component JSX...
    <div>Profile page content</div>
  );
}
