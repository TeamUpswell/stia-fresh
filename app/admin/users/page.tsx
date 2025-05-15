"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import PermissionGate from "@/components/PermissionGate";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

// Update the interface to match Supabase's return structure
interface UserWithRole {
  user_id: string;
  role: string;
  users: {
    email: string;
  }[]; // Changed from single object to array
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("user_roles").select(`
          user_id,
          role,
          users:user_id (email)
        `);

      if (data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole });

    if (!error) {
      // Update local state
      setUsers(
        users.map((user) =>
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );
    }
  };

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="owner"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Sorry, only owners can access user management.
            </p>
          </div>
        }
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            {loading ? (
              <div className="text-center">Loading users...</div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.users[0]?.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <label
                              htmlFor={`role-select-${user.user_id}`}
                              className="sr-only"
                            >
                              Change user role
                            </label>
                            <select
                              id={`role-select-${user.user_id}`}
                              value={user.role}
                              onChange={(e) =>
                                updateUserRole(user.user_id, e.target.value)
                              }
                              className="border border-gray-300 rounded px-2 py-1"
                              title="Change user role"
                            >
                              <option value="friend">Friend</option>
                              <option value="family">Family</option>
                              <option value="manager">Manager</option>
                              <option value="owner">Owner</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
