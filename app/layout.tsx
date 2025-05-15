import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stia",
  description: "Stia Application",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}