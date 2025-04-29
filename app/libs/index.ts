import { v2 as cloudinary } from 'cloudinary';

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    

    const CLOUDINARY_URL= process.env.cLOUDINARY_URL
    export const uploadToCloudinary = async (fileUri, fileType = 'image') => {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: fileUri,
            name: `file_${Date.now()}`,
            type: fileType === 'image' ? 'image/jpeg' : 
                  fileType === 'video' ? 'video/mp4' : 'application/pdf'
          });
          formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/${fileType}/upload`,
            {
              method: 'POST',
              body: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          return await response.json();
        } catch (error) {
          console.error('Upload error:', error);
          throw error;
        }
      };
      
      export const getOptimizedUrl = (publicId, options = {}) => {
        return cloudinary.url(publicId, {
          fetch_format: 'auto',
          quality: 'auto',
          ...options
        });
      };
      
      export const downloadFile = async (url) => {
        const { uri } = await FileSystem.downloadAsync(
          url,
          FileSystem.documentDirectory + url.split('/').pop()
        );
        return uri;
      };