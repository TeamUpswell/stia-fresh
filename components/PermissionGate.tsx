"use client";

import { useAuth } from "@/components/AuthProvider";

// Update UserRole definition to be clearer about single vs multiple roles
type UserRole = string | string[];

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  customCheck?: () => boolean;
}

export default function PermissionGate({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  customCheck,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  // Check if we should use the custom check
  let hasAccess = false;

  if (typeof customCheck === "function") {
    console.log("Using custom permission check for:", requiredRole);
    hasAccess = customCheck();
  } else {
    // Handle permission checks based on type
    if (requiredPermission && typeof hasPermission === "function") {
      hasAccess = hasPermission(requiredPermission);
    } else if (requiredRole && typeof hasPermission === "function") {
      // Handle both string and string[] cases
      if (Array.isArray(requiredRole)) {
        // If it's an array, check if the user has any of the required roles
        hasAccess = requiredRole.some((role) => hasPermission(role));
      } else {
        // If it's a single role (string)
        hasAccess = hasPermission(requiredRole);
      }
    }
  }

  // Based on access, render children or fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
