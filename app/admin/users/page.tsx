"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import PermissionGate from "@/components/PermissionGate";

interface AppUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  created_at: string;
  roles?: string[];
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (userId: string, role: string) => {
    const userRoles = users.find(u => u.id === userId)?.roles || [];
    const hasRole = userRoles.includes(role);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
          action: hasRole ? 'remove' : 'add'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
      
      // Refresh users list
      fetchUsers();
      
    } catch (error) {
      console.error("Error toggling role:", error);
      alert("Failed to update role");
    }
  };

  return (
    <AuthenticatedLayout>
      <PermissionGate 
        requiredRole="owner" 
        fallback={<div className="p-8 text-center">Access restricted to property owners.</div>}
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
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-800 font-medium">{(user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || 'No Name'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? 
                            user.roles.map((role: string) => (
                              <span key={role} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {role}
                              </span>
                            )) : 
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              No roles
                            </span>
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setSelectedUser(user)} 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleRole(user.id, 'admin')} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Toggle Admin Role
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
