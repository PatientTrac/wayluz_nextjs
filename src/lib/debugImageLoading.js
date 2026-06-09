/**
 * Debug utility for tracking image loading issues
 */

export const logPropertyData = (property, source = 'PropertyDetail') => {
  console.group(`🔍 Property Data Debug (${source})`);
  
  if (!property) {
    console.error('Property object is null or undefined');
    console.groupEnd();
    return;
  }

  console.log('Property ID:', property.id);
  console.log('Name:', property.name);
  
  // Log Images Structure
  console.log('📸 Images Data Type:', typeof property.images);
  console.log('📸 Images Is Array?', Array.isArray(property.images));
  console.log('📸 Raw Images Data:', property.images);

  // Check Featured Image
  console.log('⭐ Featured Image URL:', property.featured_image_url);

  // Validate Images
  if (Array.isArray(property.images)) {
    property.images.forEach((img, idx) => {
      console.log(`   [Image ${idx}] Type:`, typeof img);
      if (typeof img === 'object') {
        console.log(`   [Image ${idx}] URL:`, img?.url);
        console.log(`   [Image ${idx}] Featured:`, img?.featured);
      } else {
        console.log(`   [Image ${idx}] Value:`, img);
      }
    });
  }

  console.groupEnd();
};

export const validateImageUrl = (url) => {
  if (!url) return { isValid: false, reason: 'URL is null or empty' };
  if (typeof url !== 'string') return { isValid: false, reason: 'URL is not a string' };
  
  // Basic URL pattern check
  try {
    new URL(url);
    return { isValid: true };
  } catch (e) {
    return { isValid: false, reason: 'Invalid URL format' };
  }
};

export const testImageLoad = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ success: true, width: img.width, height: img.height });
    img.onerror = () => resolve({ success: false, error: 'Failed to load' });
    img.src = url;
  });
};