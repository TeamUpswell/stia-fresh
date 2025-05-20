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
            .rpc('get_users')
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
          const userRoles = rolesData
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
        </div>
      </PermissionGate>
    </AuthenticatedLayout>
  );
}
