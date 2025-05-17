"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}