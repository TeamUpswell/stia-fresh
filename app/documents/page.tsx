// Or wherever your document upload function is located

const uploadDocument = async (file, documentName) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${documentName}-${Date.now()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from("documents")
    .upload(fileName, file, {
      cacheControl: "31536000", // 1 year for static documents
      upsert: true,
    });
    
  // Rest of your function...
};