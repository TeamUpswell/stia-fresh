"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        // Sign-up logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: name || email.split('@')[0]  // Use name or part of email
            }
          },
        });

        if (error) {
          setError(error.message);
        } else {
          // After successful signup
          if (data?.user?.id) {
            try {
              // Check if this is the first user (more reliable)
              const { count, error: countError } = await supabase
                .from("user_roles")
                .select("*", { count: "exact" });
                
              const isFirstUser = !countError && count === 0;
              
              // Assign appropriate roles
              if (isFirstUser) {
                // First user gets all admin privileges
                await supabase.from("user_roles").insert([
                  { user_id: data.user.id, role: "admin" },
                  { user_id: data.user.id, role: "family" },
                  { user_id: data.user.id, role: "manager" }
                ]);
                setMessage("Account created with admin privileges!");
              } else {
                // Regular users just get guest role
                await supabase.from("user_roles").insert({
                  user_id: data.user.id,
                  role: "guest"
                });
                setMessage("Account created successfully!");
              }
            } catch (err) {
              console.error("Error assigning user roles:", err);
            }
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">
        {isLogin ? "Sign In" : "Create Account"}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded mb-4 hover:bg-blue-700 shadow-sm"
        >
          {isLoading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>

      {!error && !isLogin && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive an email? For development, you can:
          </p>
          <button
            onClick={async () => {
              // Sign in directly (this will work if auto-confirmation is enabled in Supabase)
              const { error } = await supabase.auth.signInWithPassword({
                email, 
                password
              });
              
              if (!error) {
                router.push('/dashboard');
              } else {
                setError("Auto-login failed. You may need to configure email settings in Supabase.");
              }
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            Continue without verification (development only)
          </button>
        </div>
      )}

      <div className="text-center mt-6 bg-gray-100 p-3 rounded">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-700 hover:text-blue-900 font-medium underline"
        >
          {isLogin
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
