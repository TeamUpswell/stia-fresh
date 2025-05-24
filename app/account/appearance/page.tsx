"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function AppearancePage() {
  const { user } = useAuth();
  const { theme, updateTheme } = useTheme();
  const [saveMessage, setSaveMessage] = useState("");

  // Function to show success message when theme is selected
  const handleThemeChange = (selectedTheme: string) => {
    updateTheme(selectedTheme);
    setSaveMessage("Theme preference updated");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Appearance Settings</h1>

      {saveMessage && (
        <div className="mb-4 p-4 rounded-md bg-green-100 text-green-700 border border-green-200">
          {saveMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Theme Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Light theme option */}
          <div
            className={`cursor-pointer p-4 border rounded-lg flex flex-col items-center ${
              theme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => handleThemeChange("light")}
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-3">
              <Sun className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium">Light</h3>
          </div>

          {/* Dark theme option */}
          <div
            className={`cursor-pointer p-4 border rounded-lg flex flex-col items-center ${
              theme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => handleThemeChange("dark")}
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-3">
              <Moon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium">Dark</h3>
          </div>

          {/* System theme option */}
          <div
            className={`cursor-pointer p-4 border rounded-lg flex flex-col items-center ${
              theme === "system"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => handleThemeChange("system")}
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-3">
              <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium">System</h3>
          </div>
        </div>
      </div>
    </>
  );
}
