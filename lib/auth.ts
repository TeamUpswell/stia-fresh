import { supabase } from './supabase';

// Re-export the hook from AuthProvider
export { useAuth } from '@/components/AuthProvider';

// Additional auth utilities
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
}
