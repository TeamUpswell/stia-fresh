"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProtectedPageWrapper({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: string;
}) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (requiredRole && !hasPermission(requiredRole)) {
      router.push('/unauthorized');
    }
  }, [user, hasPermission, requiredRole, router]);

  return user ? <>{children}</> : null;
}
