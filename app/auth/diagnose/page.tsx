"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function DiagnoseDatabase() {
  const [dbInfo, setDbInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkDatabase() {
      try {
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        
        // Check for duplicate email constraint issues
        const { data: profileData, error: profileError } = await adminSupabase
          .from('profiles')
          .select('id, email')
          .eq('email', 'drew@pdxbernards.com');
          
        // Check user_roles table
        const { data: roleData, error: roleError } = await adminSupabase
          .from('user_roles')
          .select('user_id, role');
        
        // Get schema info
        const { data: schemaData, error: schemaError } = await adminSupabase
          .rpc('get_schema_info');
        
        setDbInfo({
          profileCheck: { data: profileData, error: profileError },
          roleCheck: { data: roleData, error: roleError },
          schemaInfo: { data: schemaData, error: schemaError }
        });
      } catch (err) {
        setDbInfo({ error: err });
      } finally {
        setLoading(false);
      }
    }
    
    checkDatabase();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Diagnosis</h1>
      
      {loading ? (
        <p>Loading database information...</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Profile Check</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(dbInfo.profileCheck, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Role Check</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(dbInfo.roleCheck, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Schema Info</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(dbInfo.schemaInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}