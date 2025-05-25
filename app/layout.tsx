import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { TenantProvider } from "@/lib/hooks/useTenant";
import { PropertyProvider } from "@/lib/hooks/useProperty";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "STIA Fresh",
  description: "Property Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <AuthProvider>
          <TenantProvider>
            <PropertyProvider>{children}</PropertyProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
