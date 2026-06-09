/**
 * Utility to validate video data structure from Supabase
 * @param {any} videos - The video data field to check
 * @returns {Object} - { isValid: boolean, message: string, videoCount: number }
 */
export const validateVideoData = (videos) => {
  if (videos === null || videos === undefined) {
    return { 
      isValid: false, 
      message: 'Videos field is null or undefined', 
      videoCount: 0 
    };
  }

  if (!Array.isArray(videos)) {
    return { 
      isValid: false, 
      message: `Videos field is not an array (Type: ${typeof videos}). Value: ${JSON.stringify(videos)}`, 
      videoCount: 0 
    };
  }

  if (videos.length === 0) {
    return { 
      isValid: false, 
      message: 'Videos array is empty', 
      videoCount: 0 
    };
  }

  return { 
    isValid: true, 
    message: 'Videos data appears valid and contains items', 
    videoCount: videos.length 
  };
};