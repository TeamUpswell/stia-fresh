import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Stia",
  description: "Stia Application",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster position="top-right" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}