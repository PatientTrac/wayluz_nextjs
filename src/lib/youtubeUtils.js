/**
 * Utilities for handling YouTube URLs and IDs
 */

/**
 * Extracts a YouTube video ID from various URL formats.
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - Just the ID (11 characters)
 * 
 * @param {string} url - The URL or ID string to parse
 * @returns {string|null} - The extracted YouTube ID or null if not found
 */
export const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;

  // If the input is exactly 11 characters and contains only safe characters, assume it's an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Regular expression to find the video ID in various YouTube URL formats
  // This covers short urls (youtu.be), embed urls, watch urls, etc.
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Generates a clean, secure YouTube embed URL.
 * 
 * @param {string} urlOrId - The YouTube URL or Video ID
 * @returns {string|null} - The formatted embed URL (https://www.youtube.com/embed/ID) or null
 */
export const getYouTubeEmbedUrl = (urlOrId) => {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;
  
  // Return the standard embed URL without extra parameters to ensure security and standard behavior
  return `https://www.youtube.com/embed/${id}`;
};