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

// Error handling helper function
export const logSupabaseError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
  console.error("Error details:", error.details);
};

// Helper function to explore table schemas
export const exploreTableSchema = async (tableName: string) => {
  try {
    // Get a single row to examine structure
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);
      
    if (error) {
      console.error(`Error exploring ${tableName}:`, error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data found in ${tableName}`);
      return null;
    }
    
    // Log column names
    const columns = Object.keys(data[0]);
    console.log(`${tableName} columns:`, columns);
    
    return columns;
  } catch (err) {
    console.error(`Error exploring ${tableName}:`, err);
    return null;
  }
};
