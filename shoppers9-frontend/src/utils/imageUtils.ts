// Utility functions for handling image URLs

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');
// Admin backend URL for uploaded images (where images are actually stored)
const ADMIN_BACKEND_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5002';
// For development, admin backend runs on port 5002, and images are uploaded/served from there
const UPLOADS_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5002';

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

  let resolvedUrl = '';

  // If it's a relative path starting with /, check if it's an uploaded image
  if (imagePath.startsWith('/')) {
    // Use admin backend for banner uploads (they are stored on admin backend port 5001)
    if (imagePath.startsWith('/uploads/banners/')) {
      resolvedUrl = `${ADMIN_BACKEND_URL}${imagePath}`;
    }
    // Use uploads backend for other uploaded images (products, categories)
    else if (imagePath.startsWith('/uploads/')) {
      resolvedUrl = `${UPLOADS_BASE_URL}${imagePath}`;
    }
    else {
      resolvedUrl = `${BACKEND_BASE_URL}${imagePath}`;
    }
  }
  // If it's a relative path without /, prepend appropriate backend URL
  else if (imagePath.startsWith('uploads/banners/')) {
    resolvedUrl = `${ADMIN_BACKEND_URL}/${imagePath}`;
  }
  else if (imagePath.startsWith('uploads/')) {
    resolvedUrl = `${UPLOADS_BASE_URL}/${imagePath}`;
  }
  else {
    resolvedUrl = `${BACKEND_BASE_URL}/${imagePath}`;
  }

  return resolvedUrl;
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