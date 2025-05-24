"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// Define the user metadata interface
interface UserMetadata {
  name?: string;
  [key: string]: any;
}

// Define our complete User type
interface ExtendedUser {
  id: string;
  email?: string;
  roles: string[];
  isAdmin: boolean;
  isFamily: boolean;
  isManager: boolean;
  user_metadata?: UserMetadata;
}

export default function AccountSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Load user data when available
  useEffect(() => {
    if (user) {
      // Cast user to our extended type to access user_metadata
      const extendedUser = user as unknown as ExtendedUser;
      setFullName(extendedUser.user_metadata?.name || "");
      setEmail(user.email || "");

      // Fetch from profiles table
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, address, phone_number")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            setFullName(
              data.full_name || extendedUser.user_metadata?.name || ""
            );
            setAddress(data.address || "");
            setPhoneNumber(data.phone_number || "");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ text: "", type: "" });

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if email was changed
      const emailChanged = email !== user.email;

      if (emailChanged) {
        // Update email in auth
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) throw emailError;
      }

      // Update user metadata and profile
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: fullName },
      });

      if (authError) throw authError;

      // Update profiles table with all fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          address: address,
          phone_number: phoneNumber,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setMessage({
        text: emailChanged
          ? "Profile updated successfully. Please check your email to confirm the email change."
          : "Profile updated successfully",
        type: "success",
      });
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setMessage({
        text: errorMessage || "Error updating profile",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-green-100 text-green-700 border border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
            <p className="mt-1 text-sm text-gray-500">
              Changing your email will require verification
            </p>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Mobile Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="(123) 456-7890"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Physical Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="Street, City, State, ZIP"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
