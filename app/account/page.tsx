"use client";

import { useState, useEffect, useContext } from "react";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  Eye,
  EyeOff,
  Home,
  Plus,
  Settings,
  LogOut,
  CheckCircle,
} from "lucide-react";
import { useProperty } from "@/lib/hooks/useProperty";
import { useTenant } from "@/lib/hooks/useTenant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  
  // ✅ Use the GLOBAL property context instead
  const {
    properties,
    currentProperty,
    switchProperty, // Use this instead of setCurrentProperty
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useProperty(); // This connects to your global state
  
  const tenantDebug = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    email: "",
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ ALL useEffect hooks MUST BE HERE - BEFORE any conditional logic
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile({
          id: data.id,
          email: data.email || user.email || "",
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        setProfile({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zip: "",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Add this useEffect to debug current property changes:
  useEffect(() => {
    console.log("🏠 Current Property Changed:", {
      currentProperty: currentProperty?.name,
      id: currentProperty?.id,
      timestamp: new Date().toISOString(),
    });
  }, [currentProperty]);

  // ✅ ALL FUNCTIONS (not hooks) can be defined here
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    console.log("🔓 Starting logout process...");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("🔴 Supabase logout error:", error);
        toast.error("Failed to sign out. Please try again.");
        return;
      }

      console.log("✅ Logout successful, redirecting...");
      toast.success("Signed out successfully!");
      router.push("/auth/login");
    } catch (error) {
      console.error("🔴 Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Add test database access function
  const testDatabaseAccess = async () => {
    console.log("🔴 BUTTON CLICKED - Testing direct database access...");
    console.log("🔴 Current timestamp:", new Date().toISOString());

    try {
      // Test 1: Current user
      console.log("🔍 Step 1: Getting current user...");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("🔍 Current user result:", user?.id, userError);

      if (!user) {
        console.log("❌ No user found");
        return;
      }

      // Test 2: User's tenants
      console.log("🔍 Step 2: Getting user tenants...");
      const { data: userTenants, error: tenantError } = await supabase
        .from("tenant_users")
        .select("*, tenants(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      console.log("🔍 User tenants result:", userTenants, tenantError);

      if (tenantError) {
        console.error("❌ Tenant error:", tenantError);
        return;
      }

      // Test 3: Properties for those tenants
      if (userTenants && userTenants.length > 0) {
        console.log("🔍 Step 3: Getting properties...");
        const tenantIds = userTenants.map((tu) => tu.tenant_id);
        console.log("🔍 Tenant IDs:", tenantIds);

        const { data: properties, error: propError } = await supabase
          .from("properties")
          .select("*")
          .in("tenant_id", tenantIds);

        console.log("🔍 Properties result:", properties, propError);

        if (propError) {
          console.error("❌ Properties error:", propError);
        }
      } else {
        console.log("❌ No user tenants found");
      }

      console.log("✅ Database test completed");
    } catch (error) {
      console.error("🔴 Error in testDatabaseAccess:", error);
    }
  };

  // ✅ NOW you can do conditional logic and debug logs AFTER all hooks
  console.log("🔍 Account Page Debug:", {
    user: user?.id,
    properties,
    propertiesLength: properties?.length,
    timestamp: new Date().toISOString(),
  });

  console.log("🏢 useTenant Debug:", {
    user: tenantDebug.user,
    tenants: tenantDebug.tenants,
    currentTenant: tenantDebug.currentTenant,
    loading: tenantDebug.loading,
    tenantsLength: tenantDebug.tenants?.length,
  });

  // ✅ NOW you can do early returns AFTER all hooks
  if (!user || tenantDebug.loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading account data...</span>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Add this component to your account page:
  const PropertySelector = ({ properties, currentProperty, onSelect }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <Home className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Select Active Property
          </h2>
        </div>

        <div className="space-y-3">
          {properties?.map((property) => (
            <button
              key={property.id}
              onClick={() => onSelect(property)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                currentProperty?.id === property.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {property.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {property.address}, {property.city}, {property.state}
                  </p>
                </div>
                {currentProperty?.id === property.id && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {currentProperty && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>{currentProperty.name}</strong> is now your active property.
              All cleaning schedules and tasks will be associated with this property.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ✅ Main component JSX return
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your profile, security, and property settings
          </p>
        </div>

        {/* Add Test Button */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-red-900 dark:text-red-100">
            Direct Database Test
          </h3>
          <button
            onClick={testDatabaseAccess}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Test Direct DB Access
          </button>
          <p className="text-sm mt-2 text-red-700 dark:text-red-300">
            Properties count: {properties?.length || 0} | Current: None
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={profile.state}
                      onChange={(e) =>
                        setProfile({ ...profile, state: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={profile.zip}
                      onChange={(e) =>
                        setProfile({ ...profile, zip: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>

          {/* Security Settings Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Change Password
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Password Requirements:</strong> At least 6 characters
                  long. Mix of letters and numbers recommended.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Lock className="h-5 w-5 mr-2" />
                  )}
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Property Management Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Home className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Property Management
              </h2>
            </div>

            <div className="space-y-4">
              {/* Properties List */}
              {properties && properties.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All Properties ({properties.length})
                  </h3>
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        currentProperty?.id === property.id // ← Use currentProperty from useProperties
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => switchProperty(property)} // ← Use setCurrentProperty from useProperties
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {property.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {property.city}, {property.state}
                          </p>
                        </div>
                        {currentProperty?.id === property.id && ( // ← Use currentProperty from useProperties
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <CheckCircle className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Current</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No properties found. Check console for debugging info.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <LogOut className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Account Actions
              </h2>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
