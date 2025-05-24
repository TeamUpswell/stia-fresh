import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TenantProvider } from "@/lib/hooks/useTenant";
import { PropertyProvider } from "@/lib/hooks/useProperty";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stia",
  description: "Stia Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <ThemeProvider>
            <TenantProvider>
              <PropertyProvider>{children}</PropertyProvider>
            </TenantProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
