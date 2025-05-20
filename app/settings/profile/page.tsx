// Or wherever your avatar upload function is located

const handleAvatarUpload = async (file) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "604800", // 1 week for avatars (they change more often)
      upsert: true,
    });
    
  // Rest of your function...
};