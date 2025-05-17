"use client";

import { useAuth } from "@/components/AuthProvider";

type UserRole = "admin" | "family" | "manager" | "guest";

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
    console.log("Custom check result:", hasAccess);
  } else {
    // Check permissions in order of precedence with null checks
    hasAccess =
      (requiredPermission &&
        typeof hasPermission === "function" &&
        hasPermission(requiredPermission)) ||
      (requiredRole &&
        typeof hasPermission === "function" &&
        hasPermission(requiredRole));
  }

  // Based on access, render children or fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
