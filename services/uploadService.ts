export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  // Note: In a production environment, the base URL should be configured via environment variables.
  // Since Vercel will host the API at /api, we use a relative path.
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload image to Cloudinary via API.');
  }

  const data = await response.json();
  return data.imageUrl;
};
