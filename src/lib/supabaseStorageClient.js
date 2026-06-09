import { supabase } from './customSupabaseClient';

const BUCKET_NAME = 'property-images';

// Helper to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Uploads an image to Supabase Storage
 * @param {File} file - The file object to upload
 * @param {string} propertyId - The ID of the property (must be UUID)
 * @returns {Promise<{url: string, path: string}>}
 */
export const uploadImage = async (file, propertyId) => {
  try {
    // Validate propertyId is a UUID to maintain consistency
    if (!isValidUUID(propertyId)) {
      throw new Error(`Invalid property ID format: ${propertyId}. Expected UUID.`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `properties/${propertyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase Storage
 * @param {string} imagePath - The path of the image in storage (not the full URL)
 * @returns {Promise<void>}
 */
export const deleteImage = async (imagePath) => {
  try {
    // Extract path if full URL is provided
    let path = imagePath;
    if (imagePath.startsWith('http')) {
      const url = new URL(imagePath);
      // Expected format: .../storage/v1/object/public/bucket-name/path/to/file
      const parts = url.pathname.split(`/${BUCKET_NAME}/`);
      if (parts.length > 1) {
        path = parts[1];
      }
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Gets the public URL for a given path
 * @param {string} path - Storage path
 * @returns {string}
 */
export const getPublicUrl = (path) => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  return data.publicUrl;
};