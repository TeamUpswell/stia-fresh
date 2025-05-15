import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Supabase credentials missing!");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Add this to check if Supabase is working
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('user_roles').select('count');
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}
