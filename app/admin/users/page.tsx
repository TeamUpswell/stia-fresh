"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  User,
  UserPlus,
  Edit,
  Trash2,
  Phone,
  X,
  Check,
  Mail,
  UserCog,
} from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import SideNavigation from "@/components/layout/SideNavigation";

interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  show_in_contacts: boolean;
  role?: string;
  user_metadata?: {
    role?: string;
  };
}

interface FormData {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  show_in_contacts: boolean;
  role: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  [key: string]: string | undefined;
}

interface SubmitStatus {
  type: string;
  message: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    show_in_contacts: false,
    role: "family",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    type: "",
    message: "",
  });

  useEffect(() => {
    fetchProfiles();
    checkPermissions();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);

      // Check permissions
      const { data: permissionCheck, error: permissionError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      console.log("Permission check:", permissionCheck, permissionError);

      // Fetch profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        return;
      }

      // Fetch roles for all users
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*");

      if (roleError) {
        console.error("Error fetching roles:", roleError);
      }

      // Combine profiles with their roles
      const profilesWithRoles = profileData.map((profile): Profile => {
        const userRole = roleData?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "family", // Default to family if no role found
        };
      });

      console.log("Profiles loaded:", profilesWithRoles.length);
      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error("Error in fetchProfiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      console.log("Checking permissions...");

      // Check current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      console.log("Current user:", currentUser);

      // Try test operations
      const { data: selectData, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1); // Added missing closing parenthesis

      console.log("Select test:", selectData, selectError);

      if (selectData && selectData.length > 0) {
        const testId = selectData[0].id;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", testId);

        console.log("Update test:", updateError);
      }
    } catch (error) {
      console.error("Permission check error:", error);
    }
  };

  const toggleContactVisibility = async (
    profileId: string,
    currentValue: boolean
  ) => {
    try {
      console.log(
        `Toggling visibility for profile ${profileId} from ${currentValue} to ${!currentValue}`
      );

      const { data, error } = await supabase
        .from("profiles")
        .update({ show_in_contacts: !currentValue })
        .eq("id", profileId.toString())
        .select();

      console.log("Toggle result:", data, error);

      if (error) {
        console.error("Error updating visibility:", error);
        throw error;
      }

      // Update local state
      setProfiles(
        profiles.map((profile) =>
          profile.id === profileId
            ? { ...profile, show_in_contacts: !profile.show_in_contacts }
            : profile
        )
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error updating contact visibility:", error);
      alert(`Failed to update contact visibility: ${errorMessage}`);
    }
  };

  const openAddModal = () => {
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      address: "",
      show_in_contacts: false,
      role: "family",
    });
    setFormErrors({});
    setSubmitStatus({ type: "", message: "" });
    setShowAddModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setCurrentProfile(profile);
    setFormData({
      full_name: profile.full_name || "",
      email: profile.email || "",
      phone_number: profile.phone_number || "",
      address: profile.address || "",
      show_in_contacts: profile.show_in_contacts || false,
      role: profile.role || "family",
    });
    setFormErrors({});
    setSubmitStatus({ type: "", message: "" });
    setShowEditModal(true);
  };

  const openDeleteModal = (profile: Profile) => {
    setCurrentProfile(profile);
    setShowDeleteModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    // Use type assertion for checkbox inputs
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    let errors: FormErrors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitStatus({ type: "loading", message: "Creating user..." });

      // Use server-side API to properly create users in sequence
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          show_in_contacts: formData.show_in_contacts || false,
          role: formData.role || "family",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      setSubmitStatus({
        type: "success",
        message:
          "User created successfully! An invitation email has been sent to join the property.",
      });

      await fetchProfiles();

      setTimeout(() => {
        setShowAddModal(false);
      }, 2500);
    } catch (error: unknown) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSubmitStatus({
        type: "error",
        message: `Error: ${errorMessage}`,
      });
    }
  };

  function generateRandomPassword() {
    // Generate a secure random password (12-16 characters)
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    const length = Math.floor(Math.random() * 5) + 12; // 12-16 characters
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitStatus({ type: "loading", message: "Updating user..." });

      // Ensure ID is a valid UUID string
      const profileId = currentProfile?.id?.toString();

      // 1. Update profile in Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          show_in_contacts: formData.show_in_contacts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (profileError) throw profileError;

      // 2. Update user_roles if needed
      try {
        // Check if user has a role record
        const { data: roleData, error: roleCheckError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", profileId);

        if (roleCheckError) throw roleCheckError;

        // If role exists, update it; otherwise, insert new role
        if (roleData && roleData.length > 0) {
          const { error: roleUpdateError } = await supabase
            .from("user_roles")
            .update({
              role: formData.role,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", profileId);

          if (roleUpdateError)
            console.error("Client-side role update error:", roleUpdateError);
        } else {
          const { error: roleInsertError } = await supabase
            .from("user_roles")
            .insert({
              user_id: profileId,
              role: formData.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              assigned_at: new Date().toISOString(),
            });

          if (roleInsertError)
            console.error("Client-side role insert error:", roleInsertError);
        }
      } catch (roleError) {
        console.error("Error updating role on client side:", roleError);
      }

      // 3. Update auth user through API route instead of direct supabaseAdmin
      const authResponse = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profileId,
          userData: {
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            phone_number: formData.phone_number,
            address: formData.address,
            show_in_contacts: formData.show_in_contacts,
          },
        }),
      });

      const authResult = await authResponse.json();
      console.log("Complete auth update response:", authResult);

      if (authResult.error) {
        console.error("Auth update error:", authResult.error);
        // Show the error to the user
        setSubmitStatus({
          type: "warning",
          message: `User profile updated but role may not have been updated: ${authResult.error}`,
        });
      } else {
        setSubmitStatus({
          type: "success",
          message: "User updated successfully!",
        });
      }

      await fetchProfiles();

      setTimeout(() => {
        setShowEditModal(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSubmitStatus({ type: "error", message: `Error: ${errorMessage}` });
    }
  };

  const handleDeleteUser = async () => {
    try {
      setSubmitStatus({ type: "loading", message: "Deleting user..." });

      // Use a server-side API route to handle deletion with admin privileges
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentProfile?.id,
          email: currentProfile?.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      setSubmitStatus({
        type: "success",
        message: "User deleted successfully!",
      });
      await fetchProfiles();

      setTimeout(() => {
        setShowDeleteModal(false);
      }, 1000);
    } catch (error: unknown) {
      console.error("Error deleting user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSubmitStatus({
        type: "error",
        message: `Error deleting user: ${errorMessage}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SideNavigation user={user} />
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="px-4 py-8">
            <PermissionGate requiredRole="owner">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Manage Users</h1>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Contact Info
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Show in Contacts
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {profiles.length > 0 ? (
                      profiles.map((profile) => (
                        <tr key={profile.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-black dark:text-black">
                                  {profile.full_name || "Unnamed User"}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {profile.role ||
                                    profile.user_metadata?.role ||
                                    "family"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {profile.email && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <Mail className="h-4 w-4 mr-1" />
                                {profile.email}
                              </div>
                            )}
                            {profile.phone_number && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Phone className="h-4 w-4 mr-1" />
                                {profile.phone_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                id={`contact-visibility-${profile.id}`}
                                type="checkbox"
                                checked={profile.show_in_contacts}
                                onChange={() =>
                                  toggleContactVisibility(
                                    profile.id,
                                    profile.show_in_contacts
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`contact-visibility-${profile.id}`}
                                className="ml-2 block text-sm text-gray-500 dark:text-gray-400"
                              >
                                Show in contacts
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(profile)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              aria-label="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <p className="text-gray-500 dark:text-gray-400">
                            No users found
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PermissionGate>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitStatus.message && (
              <div
                className={`mb-4 p-3 rounded ${
                  submitStatus.type === "error"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : submitStatus.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name*
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="user-full-name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  aria-label="Full Name"
                  placeholder="Enter full name"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                    formErrors.full_name ? "border-red-500" : ""
                  }`}
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  id="add-user-email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  aria-label="Email Address"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  id="add-user-phone"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  aria-label="Phone Number"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="add-user-address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  aria-label="Address"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  id="user-role"
                  value={formData.role}
                  onChange={handleInputChange}
                  aria-label="User Role"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show_in_contacts"
                    name="show_in_contacts"
                    checked={formData.show_in_contacts}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="show_in_contacts"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Show in Contacts
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitStatus.type === "loading"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {submitStatus.type === "loading" ? (
                    <span className="inline-flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-blue-200 rounded-full"></span>
                      Adding...
                    </span>
                  ) : (
                    "Add User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitStatus.message && (
              <div
                className={`mb-4 p-3 rounded ${
                  submitStatus.type === "error"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : submitStatus.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name*
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="user-full-name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  aria-label="Full Name"
                  placeholder="Enter full name"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                    formErrors.full_name ? "border-red-500" : ""
                  }`}
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  id="edit-user-email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  aria-label="Email Address"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  id="edit-user-phone"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter phone number" 
                  aria-label="Phone Number"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="edit-user-address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                  aria-label="Address"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  id="user-role"
                  value={formData.role}
                  onChange={handleInputChange}
                  aria-label="User Role"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="family">Family</option>
                  <option value="friend">Friend</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_show_in_contacts"
                    name="show_in_contacts"
                    checked={formData.show_in_contacts}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="edit_show_in_contacts"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Show in Contacts
                  </label>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                {/* Add delete button on the left */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false); // Close the edit modal
                    openDeleteModal(currentProfile!); // Open the delete modal
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span className="inline-flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </span>
                </button>

                {/* Move existing buttons to the right */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitStatus.type === "loading"}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    {submitStatus.type === "loading" ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-blue-200 rounded-full"></span>
                        Updating...
                      </span>
                    ) : (
                      "Update User"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Delete User</h2>

            {submitStatus.message && submitStatus.type !== "" ? (
              <div
                className={`mb-4 p-3 rounded ${
                  submitStatus.type === "error"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : submitStatus.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {submitStatus.message}
              </div>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete{" "}
                  <strong>{currentProfile?.full_name || "this user"}</strong>?
                </p>
                <p className="text-red-600 font-medium mb-4">
                  This action cannot be undone. The user will be permanently
                  removed from the system.
                </p>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={submitStatus.type === "loading"}
              >
                {submitStatus.type === "success" ? "Close" : "Cancel"}
              </button>

              {submitStatus.type !== "success" &&
                submitStatus.type !== "loading" && (
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete
                  </button>
                )}

              {submitStatus.type === "loading" && (
                <button
                  disabled
                  className="px-4 py-2 bg-red-600 text-white rounded-md opacity-75 flex items-center"
                >
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></span>
                  Deleting...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
