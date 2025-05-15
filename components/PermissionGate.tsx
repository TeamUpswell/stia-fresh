"use client";

import { useAuth, UserRole } from "@/components/AuthProvider";

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole; // Change string to UserRole
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export default function PermissionGate({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
}: PermissionGateProps) {
  const { hasRole, hasPermission } = useAuth();

  // Check permissions in order of precedence with null checks
  const hasAccess =
    (requiredPermission &&
      typeof hasPermission === "function" &&
      hasPermission(requiredPermission)) ||
    (requiredRole && typeof hasRole === "function" && hasRole(requiredRole));

  if (!hasAccess) return fallback;

  return <>{children}</>;
}
