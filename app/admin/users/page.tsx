"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { UsersRound, Settings, ChevronDown } from "lucide-react";

export default function UserManagementPage() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleOptions] = useState(["family", "guest", "manager", "admin"]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    roles: []
  });
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Get all user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedUsers = profiles.map((profile) => {
        const userRoles = roles
          .filter((role) => role.user_id === profile.id)
          .map((role) => role.role);

        return {
          ...profile,
          roles: userRoles,
        };
      });

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to identify the original admin
  const isOriginalAdmin = (userId) => {
    // First, find all users with admin role
    const admins = users.filter(u => u.roles.includes('admin'));
    
    if (admins.length === 0) return false;
    
    // Sort by created_at date to find the first admin
    admins.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // The first admin in the sorted list is the original
    return admins[0].id === userId;
  };

  const handleRoleToggle = async (userId, role) => {
    try {
      const user = users.find((u) => u.id === userId);
      const hasRole = user.roles.includes(role);
      
      // Prevent removing admin role from original admin
      if (role === 'admin' && isOriginalAdmin(userId) && hasRole) {
        alert("Cannot remove admin role from the original account creator.");
        return;
      }

      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;
      } else {
        // Add role
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Refresh users
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });
      
      if (error) throw error;
      
      // The user ID is now available
      const userId = data.user.id;
      
      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: newUser.email,
          full_name: newUser.full_name,
          created_at: new Date().toISOString()
        });
        
      if (profileError) throw profileError;
      
      // Add roles if any are selected
      if (newUser.roles.length > 0) {
        const roleInserts = newUser.roles.map(role => ({
          user_id: userId,
          role,
          created_at: new Date().toISOString()
        }));
        
        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(roleInserts);
          
        if (rolesError) throw rolesError;
      }
      
      // Reset form and refresh
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        roles: []
      });
      setShowAddUserForm(false);
      fetchUsers();
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error.message}`);
    }
  };

  // Only allow admins to access this page
  if (!hasPermission("admin")) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p>You need admin permissions to manage users.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddUserForm(!showAddUserForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showAddUserForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Admin dropdown for multiple admin features */}
      {user?.isAdmin && (
        <div className="relative">
          <button 
            onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Settings className="w-5 h-5 mr-3" />
            Admin
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {adminMenuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <Link href="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                <UsersRound className="w-4 h-4 inline mr-2" />
                User Management
              </Link>
              {/* Add more admin links here */}
            </div>
          )}
        </div>
      )}

      {showAddUserForm && (
        <div className="bg-white p-6 mb-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2">
                  {roleOptions.map(role => (
                    <div key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={newUser.roles.includes(role)}
                        onChange={() => {
                          if (newUser.roles.includes(role)) {
                            setNewUser({
                              ...newUser, 
                              roles: newUser.roles.filter(r => r !== role)
                            });
                          } else {
                            setNewUser({
                              ...newUser,
                              roles: [...newUser.roles, role]
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`role-${role}`} className="ml-2 text-sm text-gray-700">
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                {roleOptions.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.email}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <span className="text-gray-500">
                            {(user.full_name || user.email || "")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || "Unnamed User"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  {roleOptions.map((role) => (
                    <td
                      key={`${user.id}-${role}`}
                      className="px-6 py-4 whitespace-nowrap text-center"
                    >
                      <input
                        type="checkbox"
                        checked={user.roles.includes(role)}
                        onChange={() => handleRoleToggle(user.id, role)}
                        disabled={role === 'admin' && isOriginalAdmin(user.id) && user.roles.includes('admin')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {role === 'admin' && isOriginalAdmin(user.id) && user.roles.includes('admin') && (
                        <span className="ml-2 text-xs text-gray-500">(Owner)</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {!user.email_confirmed_at && (
                      <button
                        onClick={async () => {
                          // This requires Supabase service role key to execute
                          // For development, you can add a workaround
                          try {
                            // In production, use admin API to confirm user
                            await fetch('/api/admin/confirm-user', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id })
                            });
                            alert('User confirmed successfully');
                            fetchUsers();
                          } catch (error) {
                            console.error('Error confirming user:', error);
                            alert('Error confirming user');
                          }
                        }}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                      >
                        Confirm Email
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
