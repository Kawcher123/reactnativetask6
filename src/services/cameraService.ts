import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { ImageMetadata, NoteImage } from '../types';

class CameraService {
  private async requestPermissions() {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      mediaLibrary: mediaLibraryPermission.status === 'granted',
    };
  }

  async takePhoto(): Promise<NoteImage | null> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const processedImage = await this.processImage(asset.uri);
        return processedImage;
      }

      return null;
    } catch (error) {
      console.error('Take photo error:', error);
      throw error;
    }
  }

  async pickFromGallery(multiple: boolean = false): Promise<NoteImage[]> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.mediaLibrary) {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !multiple,
        allowsMultipleSelection: multiple,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const processedImages = await Promise.all(
          result.assets.map(asset => this.processImage(asset.uri))
        );
        return processedImages.filter(img => img !== null) as NoteImage[];
      }

      return [];
    } catch (error) {
      console.error('Pick from gallery error:', error);
      throw error;
    }
  }

  private async processImage(uri: string): Promise<NoteImage | null> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Create thumbnail
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200, height: 200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const metadata: ImageMetadata = {
        timestamp: new Date().toISOString(),
        size: fileInfo.size || 0,
        width: imageInfo.width,
        height: imageInfo.height,
      };

      const noteImage: NoteImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri,
        thumbnail: thumbnail.uri,
        metadata,
      };

      return noteImage;
    } catch (error) {
      console.error('Process image error:', error);
      return null;
    }
  }

  async saveToGallery(uri: string): Promise<boolean> {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.mediaLibrary) {
        throw new Error('Media library permission not granted');
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error('Save to gallery error:', error);
      return false;
    }
  }

  async deleteImage(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }

  async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Compress image error:', error);
      return uri;
    }
  }
}

export const cameraService = new CameraService();
export default cameraService;
