import { Cloudinary as CloudinaryCore } from 'cloudinary-core';
import * as FileSystem from 'expo-file-system';
import  Cloudinary  from 'cloudinary-react-native';

// Define types for Cloudinary response
interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  [key: string]: any;
}

interface FileToUpload {
  uri: string;
  name: string;
  type: string;
}

// Initialize Cloudinary React Native
const cloudinaryRN = new Cloudinary({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
});

// For URL generation
const cloudinaryCore = new CloudinaryCore({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  secure: true
});

/**
 * Uploads a file to Cloudinary
 */
export const uploadToCloudinary = async (
  fileUri: string,
  fileType: 'image' | 'video' | 'pdf' = 'image',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  try {
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'image/jpeg';
    
    if (fileType === 'video') {
      mimeType = 'video/mp4';
    } else if (fileType === 'pdf') {
      mimeType = 'application/pdf';
    }

    const fileName = `file_${Date.now()}.${fileExtension}`;

    const fileToUpload = {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    };

    const resourceType = fileType === 'pdf' ? 'raw' : fileType;

    const response = await cloudinaryRN.upload(fileToUpload, {
      resource_type: resourceType,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
      onProgress: (event: { loaded: number; total: number }) => {
        const progress = Math.round((event.loaded / event.total) * 100);
        if (onProgress) onProgress(progress);
      }
    });

    return response as CloudinaryUploadResponse;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Generates an optimized URL for a Cloudinary resource
 */
export const getOptimizedUrl = (
  publicId: string,
  options: Record<string, any> = {}
): string => {
  return cloudinaryCore.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options,
  });
};

/**
 * Downloads a file from a URL to local storage
 */
export const downloadFile = async (url: string): Promise<string> => {
  try {
    const fileName = url.split('/').pop() || `file_${Date.now()}`;
    const localUri = `${FileSystem.documentDirectory}${fileName}`;
    
    const { uri } = await FileSystem.downloadAsync(url, localUri);
    return uri;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const isCloudinaryConfigured = (): boolean => {
  return (
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_UPLOAD_PRESET
  );
};