import { createClient } from "@supabase/supabase-js";

export async function resetUserAndRecreate(
  userId: string,
  email: string,
  newPassword: string
) {
  console.log("Starting user reset process for:", userId);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or service key");
    return { success: false, error: "Configuration error" };
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("1. Deleting user data from tables...");
    // Delete in correct order (child records first)
    try {
      await adminSupabase.from("notes").delete().eq("user_id", userId);
      console.log("Notes deleted");
    } catch (e) {
      console.log("Note deletion error:", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("created_by", userId);
      console.log("Tasks (created_by) deleted");
    } catch (e) {
      console.log("Tasks (created_by) deletion error:", e);
    }

    try {
      await adminSupabase.from("tasks").delete().eq("assigned_to", userId);
      console.log("Tasks (assigned_to) deleted");
    } catch (e) {
      console.log("Tasks (assigned_to) deletion error:", e);
    }

    try {
      await adminSupabase.from("inventory").delete().eq("user_id", userId);
      console.log("Inventory deleted");
    } catch (e) {
      console.log("Inventory deletion error:", e);
    }

    try {
      await adminSupabase.from("reservations").delete().eq("user_id", userId);
      console.log("Reservations deleted");
    } catch (e) {
      console.log("Reservations deletion error:", e);
    }

    try {
      await adminSupabase.from("user_roles").delete().eq("user_id", userId);
      console.log("User roles deleted");
    } catch (e) {
      console.log("User roles deletion error:", e);
    }

    try {
      await adminSupabase.from("profiles").delete().eq("id", userId);
      console.log("Profile deleted");
    } catch (e) {
      console.log("Profile deletion error:", e);
    }

    console.log("2. Deleting user from Auth...");
    const { error: authDeleteError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting user from Auth:", authDeleteError);
      throw authDeleteError;
    }

    console.log("3. Creating new user...");
    const { data, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
      });

    if (createError) {
      console.error("Error creating new user:", createError);
      throw createError;
    }

    console.log("4. Creating profile and role for new user...");
    const newUserId = data.user.id;

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: "Drew R Bernard",
        email: email,
        avatar_url: "",
        phone_number: "",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    const { error: roleError } = await adminSupabase.from("user_roles").insert({
      user_id: newUserId,
      role: "owner",
    });

    if (roleError) {
      console.error("Error creating role:", roleError);
      throw roleError;
    }

    console.log("User successfully reset with new ID:", newUserId);
    return { success: true, userId: newUserId };
  } catch (error) {
    console.error("Error in resetUserAndRecreate:", error);
    return { success: false, error };
  }
}

// Role management dialog
const [showRoleDialog, setShowRoleDialog] = useState(false);

const handleToggleRole = async (userId: string, role: string) => {
  try {
    const userRoles = users.find(u => u.id === userId)?.roles || [];
    const hasRole = userRoles.includes(role);
    
    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .match({ user_id: userId, role });
        
      if (error) throw error;
    } else {
      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString()
        });
        
      if (error) throw error;
    }
    
    // Refresh user list
    fetchUsers();
    
  } catch (error) {
    console.error("Error updating role:", error);
    alert("Failed to update role");
  }
};

{/* Role management dialog */}
{selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Manage User: {selectedUser.email}</h3>
        <button 
          onClick={() => setSelectedUser(null)}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Assign or remove roles:</p>
          
          {['owner', 'manager', 'family', 'guest'].map(role => {
            const hasRole = selectedUser.roles?.includes(role) || false;
            
            return (
              <div key={role} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`role-${role}`}
                  checked={hasRole}
                  onChange={() => handleToggleRole(selectedUser.id, role)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor={`role-${role}`} className="ml-2 text-gray-700 capitalize">
                  {role}
                </label>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setSelectedUser(null)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
)}
