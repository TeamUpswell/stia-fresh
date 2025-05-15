import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Function to check if user is authenticated in middleware
export async function isAuthenticated() {
  const supabase = createServerComponentClient({ cookies });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
}