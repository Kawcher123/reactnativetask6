import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

export interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
  location: boolean;
  notifications: boolean;
}

export interface PermissionRequest {
  name: string;
  description: string;
  icon: string;
  isGranted: boolean;
  canRequest: boolean;
}

class PermissionsService {
  // Check all permissions status
  async checkAllPermissions(): Promise<PermissionStatus> {
    try {
      const [camera, mediaLibrary, location, notifications] = await Promise.all([
        this.checkCameraPermission(),
        this.checkMediaLibraryPermission(),
        this.checkLocationPermission(),
        this.checkNotificationPermission(),
      ]);

      return {
        camera,
        mediaLibrary,
        location,
        notifications,
      };
    } catch (error) {
      console.error('Check all permissions error:', error);
      return {
        camera: false,
        mediaLibrary: false,
        location: false,
        notifications: false,
      };
    }
  }

  // Check camera permission
  async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Check camera permission error:', error);
      return false;
    }
  }

  // Check media library permission
  async checkMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Check media library permission error:', error);
      return false;
    }
  }

  // Check location permission
  async checkLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Check location permission error:', error);
      return false;
    }
  }

  // Check notification permission
  async checkNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Check notification permission error:', error);
      return false;
    }
  }

  // Request camera permission
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Request camera permission error:', error);
      return false;
    }
  }

  // Request media library permission
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Request media library permission error:', error);
      return false;
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Request location permission error:', error);
      return false;
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Request notification permission error:', error);
      return false;
    }
  }

  // Get permission requests for UI
  async getPermissionRequests(): Promise<PermissionRequest[]> {
    try {
      const permissions = await this.checkAllPermissions();
      
      return [
        {
          name: 'Camera',
          description: 'Take photos and record videos for your notes',
          icon: '📷',
          isGranted: permissions.camera,
          canRequest: true,
        },
        {
          name: 'Photo Library',
          description: 'Access your photos to attach to notes',
          icon: '🖼️',
          isGranted: permissions.mediaLibrary,
          canRequest: true,
        },
        {
          name: 'Location',
          description: 'Tag your notes with location and discover notes near you',
          icon: '📍',
          isGranted: permissions.location,
          canRequest: true,
        },
        {
          name: 'Notifications',
          description: 'Get notified when others interact with your notes',
          icon: '🔔',
          isGranted: permissions.notifications,
          canRequest: true,
        },
      ];
    } catch (error) {
      console.error('Get permission requests error:', error);
      return [];
    }
  }

  // Request specific permission
  async requestPermission(permissionName: string): Promise<boolean> {
    try {
      switch (permissionName.toLowerCase()) {
        case 'camera':
          return await this.requestCameraPermission();
        case 'photo library':
        case 'media library':
          return await this.requestMediaLibraryPermission();
        case 'location':
          return await this.requestLocationPermission();
        case 'notifications':
          return await this.requestNotificationPermission();
        default:
          throw new Error(`Unknown permission: ${permissionName}`);
      }
    } catch (error) {
      console.error(`Request ${permissionName} permission error:`, error);
      return false;
    }
  }

  // Check if app has all required permissions
  async hasAllRequiredPermissions(): Promise<boolean> {
    try {
      const permissions = await this.checkAllPermissions();
      return Object.values(permissions).every(Boolean);
    } catch (error) {
      console.error('Check all required permissions error:', error);
      return false;
    }
  }

  // Get permission explanation text
  getPermissionExplanation(permissionName: string): string {
    const explanations: Record<string, string> = {
      camera: 'Camera access allows you to take photos directly in the app and attach them to your notes. This makes your notes more visual and engaging.',
      'photo library': 'Photo library access lets you choose existing photos from your device to attach to notes. This saves time and gives you more options.',
      location: 'Location access enables you to tag your notes with where you are, discover notes from other users in your area, and organize notes by location.',
      notifications: 'Notifications keep you updated on social interactions with your notes, like when someone likes or comments on your public notes.',
    };

    return explanations[permissionName.toLowerCase()] || 'This permission is needed for the app to function properly.';
  }

  // Get permission benefits
  getPermissionBenefits(permissionName: string): string[] {
    const benefits: Record<string, string[]> = {
      camera: [
        'Take photos directly in the app',
        'Create visual notes instantly',
        'No need to switch between apps',
      ],
      'photo library': [
        'Access all your existing photos',
        'Quickly attach relevant images',
        'Organize notes with visual content',
      ],
      location: [
        'Tag notes with your location',
        'Discover notes from nearby users',
        'Organize notes by place',
        'Find notes you created in specific locations',
      ],
      notifications: [
        'Stay updated on social interactions',
        'Know when others engage with your content',
        'Build connections with other users',
        'Never miss important interactions',
      ],
    };

    return benefits[permissionName.toLowerCase()] || [];
  }
}

export const permissionsService = new PermissionsService();
export default permissionsService;
