// Utility functions for handling image URLs

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Converts a relative image path to an absolute URL
 * @param imagePath - The image path (can be relative or absolute)
 * @returns Absolute image URL
 */
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) {
    return '/placeholder-image.svg';
  }

  // If it's a placeholder image, return as is (served from frontend public directory)
  if (imagePath === '/placeholder-image.svg') {
    return imagePath;
  }

  // If it's already an absolute URL (starts with http), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If it's a data URL (base64), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's a relative path starting with /, prepend backend base URL
  if (imagePath.startsWith('/')) {
    return `${BACKEND_BASE_URL}${imagePath}`;
  }

  // If it's a relative path without /, prepend backend base URL with /
  return `${BACKEND_BASE_URL}/${imagePath}`;
};

/**
 * Converts an array of image paths to absolute URLs
 * @param imagePaths - Array of image paths
 * @returns Array of absolute image URLs
 */
export const getImageUrls = (imagePaths: string[] | undefined): string[] => {
  if (!imagePaths || imagePaths.length === 0) {
    return ['/placeholder-image.svg'];
  }

  return imagePaths.map(getImageUrl);
};