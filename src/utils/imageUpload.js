// Image Upload Utility for DigitalOcean Spaces
// Compatible with AWS S3 SDK

import AWS from 'aws-sdk';

// Configure DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(import.meta.env.VITE_SPACES_ENDPOINT || 'blr1.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: import.meta.env.VITE_SPACES_KEY,
  secretAccessKey: import.meta.env.VITE_SPACES_SECRET,
  region: 'blr1', // Bangalore region
});

const BUCKET_NAME = import.meta.env.VITE_SPACES_BUCKET || 'edensnews';
const CDN_URL = import.meta.env.VITE_SPACES_CDN_URL || `https://${BUCKET_NAME}.blr1.cdn.digitaloceanspaces.com`;

/**
 * Upload image to DigitalOcean Spaces
 * @param {File} file - Image file to upload
 * @param {string} folder - Optional folder path (e.g., 'articles', 'avatars')
 * @returns {Promise<string>} - CDN URL of uploaded image
 */
export async function uploadImage(file, folder = 'images') {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: file,
      ACL: 'public-read',
      ContentType: file.type,
      CacheControl: 'max-age=31536000', // Cache for 1 year
    };

    // Upload to Spaces
    const data = await s3.upload(params).promise();
    
    // Return CDN URL
    const cdnUrl = `${CDN_URL}/${filename}`;
    console.log('Image uploaded:', cdnUrl);
    
    return cdnUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete image from DigitalOcean Spaces
 * @param {string} imageUrl - Full CDN URL of image to delete
 * @returns {Promise<boolean>}
 */
export async function deleteImage(imageUrl) {
  try {
    // Extract key from CDN URL
    const key = imageUrl.replace(`${CDN_URL}/`, '');
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    console.log('Image deleted:', imageUrl);
    
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Upload multiple images
 * @param {FileList} files - Multiple image files
 * @param {string} folder - Optional folder path
 * @returns {Promise<string[]>} - Array of CDN URLs
 */
export async function uploadMultipleImages(files, folder = 'images') {
  const uploadPromises = Array.from(files).map(file => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Optimize image before upload (resize if too large)
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {Promise<File>} - Optimized image file
 */
export async function optimizeImage(file, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Check if resize needed
        if (img.width <= maxWidth) {
          resolve(file);
          return;
        }

        // Calculate new dimensions
        const ratio = maxWidth / img.width;
        const newWidth = maxWidth;
        const newHeight = img.height * ratio;

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob
        canvas.toBlob((blob) => {
          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        }, file.type, 0.9); // 90% quality
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload with optimization
 * @param {File} file - Image file
 * @param {string} folder - Optional folder path
 * @param {number} maxWidth - Maximum width for optimization
 * @returns {Promise<string>} - CDN URL
 */
export async function uploadOptimizedImage(file, folder = 'images', maxWidth = 1920) {
  const optimizedFile = await optimizeImage(file, maxWidth);
  return uploadImage(optimizedFile, folder);
}
