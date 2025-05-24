import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { TenantProvider } from "@/lib/hooks/useTenant";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stia",
  description: "Stia Application",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TenantProvider>
              <PropertyProvider>{children}</PropertyProvider>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
