// src/services/cloudinary.ts

export const uploadToCloudinary = async (imageUri: string) => {
  // Substitua pelos seus dados reais do Cloudinary
  const cloudName = 'dzke1vot8'; 
  const uploadPreset = 'agenda-photos'; // O preset que você criou

  const data = new FormData();
  
  // O Cloudinary precisa desses dados exatos no FormData
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg', 
    name: 'profile_pic.jpg',
  } as any); // 'as any' é necessário no React Native para evitar erro de tipo no FormData
  
  data.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await response.json();
    
    if (result.secure_url) {
      return result.secure_url; // Retorna o link da imagem (ex: https://res.cloudinary...)
    } else {
      console.error("Erro Cloudinary:", result);
      return null;
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    return null;
  }
};