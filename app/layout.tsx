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
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
          defer
        />
      </head>
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
