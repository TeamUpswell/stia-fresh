"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Confirming your email...");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code from URL
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        
        if (code) {
          // Only handle email verification and password recovery
          if (type === "recovery") {
            setMessage("Processing your password reset request...");
            router.push(`/auth/reset-password?code=${code}`);
            return;
          }
          
          // Handle email confirmation
          const { error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: "email" 
          });
          
          if (error) {
            setError(`Error confirming email: ${error.message}`);
          } else {
            setMessage("Email confirmed successfully!");
            
            // Redirect after short delay
            setTimeout(() => {
              router.push("/auth?confirmed=true");
            }, 2000);
          }
        } else {
          setError("No confirmation code found in URL");
        }
      } catch (err) {
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    handleCallback();
  }, [searchParams, router]);
  
  return (
    <div className="p-8 max-w-md mx-auto mt-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
      
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-red-600">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={() => router.push('/auth')}
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p>{message}</p>
          {message.includes("successfully") && (
            <p className="mt-2 text-sm text-gray-600">
              Redirecting you to the login page...
            </p>
          )}
        </div>
      )}
    </div>
  );
}