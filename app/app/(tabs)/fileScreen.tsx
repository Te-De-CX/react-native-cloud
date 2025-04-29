import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadToCloudinary, getOptimizedUrl } from '../../libs/index';
import { downloadFile } from '../../libs/index';
import { FileSystem } from 'expo-file-system';
import { Icon } from 'react-native-elements';
import Pdf from 'react-native-pdf';

const FileScreen = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      handleUpload(result.assets, 'image');
    }
  };

  const selectDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*', 'application/pdf'],
      multiple: true,
    });

    if (!result.canceled) {
      handleUpload(result.assets, result.assets[0].mimeType.includes('image') ? 'image' : 
        result.assets[0].mimeType.includes('video') ? 'video' : 'pdf');
    }
  };

  const handleUpload = async (assets, type) => {
    setUploading(true);
    setProgress(0);
    
    try {
      const uploadPromises = assets.map(async (asset) => {
        const response = await uploadToCloudinary(
          asset.uri, 
          type,
          (progressEvent) => {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setProgress(progress);
          }
        );
        
        return {
          url: response.secure_url,
          publicId: response.public_id,
          type: response.resource_type,
          name: asset.name || `file_${Date.now()}`,
          localUri: asset.uri,
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const previewFile = (file) => {
    if (file.type === 'image') {
      return (
        <Image 
          source={{ uri: getOptimizedUrl(file.publicId, { width: 300, height: 300, crop: 'fill' }) }} 
          style={styles.previewImage} 
        />
      );
    } else if (file.type === 'video') {
      return (
        <View style={styles.videoContainer}>
          <Icon name="play-circle-filled" size={50} color="#fff" />
          <Image 
            source={{ uri: getOptimizedUrl(file.publicId, { resource_type: 'video', format: 'jpg' }) }} 
            style={styles.previewImage} 
          />
        </View>
      );
    } else {
      return (
        <View style={styles.documentContainer}>
          <Icon name="picture-as-pdf" size={50} color="#e53935" />
          <Text style={styles.documentText}>PDF Document</Text>
        </View>
      );
    }
  };

  const downloadFile = async (file) => {
    try {
      const localUri = await downloadFile(file.url);
      alert(`File downloaded to: ${localUri}`);
      // Optionally open the file
      await Linking.openURL(localUri);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cloudinary File Manager</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.button}
          onPress={selectImage}
          disabled={uploading}
        >
          <Icon name="image" size={24} color="white" />
          <Text style={styles.buttonText}>Upload Images/Videos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={selectDocument}
          disabled={uploading}
        >
          <Icon name="insert-drive-file" size={24} color="white" />
          <Text style={styles.buttonText}>Upload Documents</Text>
        </TouchableOpacity>
      </View>
      
      {uploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.progressText}>Uploading... {progress}%</Text>
        </View>
      )}
      
      <ScrollView style={styles.filesContainer}>
        {files.map((file, index) => (
          <View key={index} style={styles.fileCard}>
            <TouchableOpacity onPress={() => downloadFile(file)}>
              {previewFile(file)}
            </TouchableOpacity>
            
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileType}>{file.type.toUpperCase()}</Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(file.url)}
                >
                  <Icon name="open-in-browser" size={20} color="#6200ee" />
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => downloadFile(file)}
                >
                  <Icon name="file-download" size={20} color="#6200ee" />
                  <Text style={styles.actionText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#6200ee',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressText: {
    marginTop: 8,
    color: '#6200ee',
  },
  filesContainer: {
    flex: 1,
  },
  fileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  documentContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  documentText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  fileName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fileType: {
    color: '#666',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    color: '#6200ee',
  },
});

export default FileScreen;