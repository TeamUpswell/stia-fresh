"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import PermissionGate from "@/components/PermissionGate";
import Image from "next/image";

interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  email_confirmed_at?: string;
  created_at: string;
  roles?: string[];
}

export default function UserManagementPage() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Use the auth.users table instead of users
        const { data, error } = await supabase
          .from("auth_users_view") // We'll create this view
          .select("*");

        if (error) {
          // If the view doesn't exist yet, handle it gracefully
          console.error("Error fetching users:", error);

          // Fetch from auth.users using a function call instead
          const { data: userData, error: funcError } = await supabase
            .rpc("get_users")
            .select();

          if (funcError) {
            console.error("Backup method failed too:", funcError);
            setUsers([]);
            return;
          }

          setUsers(userData);
          return;
        }

        // Get user roles in a separate query
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("*");

        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
          // Continue with users but without roles
          setUsers(data);
          return;
        }

        // Map roles to users
        const usersWithRoles = data.map((user: AppUser) => {
          const userRoles =
            rolesData
              ?.filter((role: any) => role.user_id === user.id)
              .map((role: any) => role.role) || [];

          return {
            ...user,
            roles: userRoles,
          };
        });

        setUsers(usersWithRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const saveUserChanges = async () => {
    if (!selectedUser) return;

    try {
      // First update the user's name if changed
      if (selectedUser.full_name !== undefined) {
        const { error: updateError } = await supabase.rpc("update_user_name", {
          user_id: selectedUser.id,
          new_name: selectedUser.full_name,
        });

        if (updateError) {
          throw updateError;
        }
      }

      // Then update roles by removing all existing roles for this user and adding the new ones
      if (selectedUser.roles) {
        // Delete existing roles
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.id);

        if (deleteError) throw deleteError;

        // Add new roles
        if (selectedUser.roles.length > 0) {
          const rolesToInsert = selectedUser.roles.map((role) => ({
            user_id: selectedUser.id,
            role: role,
          }));

          const { error: insertError } = await supabase
            .from("user_roles")
            .insert(rolesToInsert);

          if (insertError) throw insertError;
        }
      }

      // Refresh the user list
      const { data, error } = await supabase
        .from("auth_users_view")
        .select("*");

      if (!error && data) {
        // Get user roles again
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("*");

        // Map roles to users
        const usersWithRoles = data.map((user: AppUser) => {
          const userRoles =
            rolesData
              ?.filter((role: any) => role.user_id === user.id)
              .map((role: any) => role.role) || [];

          return { ...user, roles: userRoles };
        });

        setUsers(usersWithRoles);
      }

      // Close the modal
      setSelectedUser(null);

      // Show success message
      alert("User updated successfully");
    } catch (error: any) {
      console.error("Error updating user:", error);
      alert(`Error updating user: ${error.message}`);
    }
  };

  return (
    <AuthenticatedLayout>
      <PermissionGate
        requiredRole="owner"
        fallback={
          <div className="p-8 text-center">
            Access restricted to property owners.
          </div>
        }
      >
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">User Management</h1>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0">
                            {user.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-800 font-medium">
                                  {(user.full_name || user.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || "No Name"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role: string) => (
                              <span
                                key={role}
                                className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              No roles
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* User Edit Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Edit User: {selectedUser.email}
                  </h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedUser.full_name || ""}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roles
                    </label>
                    <div className="space-y-2">
                      {["owner", "manager", "family", "guest"].map((role) => (
                        <div key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            checked={
                              selectedUser.roles?.includes(role) || false
                            }
                            onChange={(e) => {
                              const updatedRoles = e.target.checked
                                ? [...(selectedUser.roles || []), role]
                                : (selectedUser.roles || []).filter(
                                    (r) => r !== role
                                  );

                              setSelectedUser({
                                ...selectedUser,
                                roles: updatedRoles,
                              });
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`role-${role}`}
                            className="ml-2 block text-sm text-gray-900 capitalize"
                          >
                            {role}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveUserChanges}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PermissionGate>
    </AuthenticatedLayout>
  );
}
