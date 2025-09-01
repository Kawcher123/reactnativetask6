import * as Haptics from 'expo-haptics';

// Haptic feedback types for different interactions
export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection',
}

class HapticUtils {
  // Check if haptics are supported on the current device
  async isSupported(): Promise<boolean> {
    try {
      // Try to trigger a light haptic to check if supported
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return true;
    } catch (error) {
      console.warn('Haptics not available:', error);
      return false;
    }
  }

  // Light haptic feedback (for subtle interactions)
  async light(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Medium haptic feedback (for standard interactions)
  async medium(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Heavy haptic feedback (for important interactions)
  async heavy(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Success haptic feedback
  async success(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Warning haptic feedback
  async warning(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Error haptic feedback
  async error(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Selection haptic feedback
  async selection(): Promise<void> {
    try {
      if (await this.isSupported()) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }

  // Generic haptic feedback based on type
  async trigger(type: HapticType): Promise<void> {
    switch (type) {
      case HapticType.LIGHT:
        await this.light();
        break;
      case HapticType.MEDIUM:
        await this.medium();
        break;
      case HapticType.HEAVY:
        await this.heavy();
        break;
      case HapticType.SUCCESS:
        await this.success();
        break;
      case HapticType.WARNING:
        await this.warning();
        break;
      case HapticType.ERROR:
        await this.error();
        break;
      case HapticType.SELECTION:
        await this.selection();
        break;
      default:
        await this.light();
    }
  }

  // Haptic feedback for button presses
  async buttonPress(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for successful actions
  async actionSuccess(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for failed actions
  async actionError(): Promise<void> {
    await this.error();
  }

  // Haptic feedback for navigation
  async navigation(): Promise<void> {
    await this.selection();
  }

  // Haptic feedback for form interactions
  async formInteraction(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for list item selection
  async listSelection(): Promise<void> {
    await this.selection();
  }

  // Haptic feedback for toggle switches
  async toggle(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for sliders
  async slider(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for long press
  async longPress(): Promise<void> {
    await this.medium();
  }

  // Haptic feedback for pull to refresh
  async pullToRefresh(): Promise<void> {
    await this.medium();
  }

  // Haptic feedback for like/unlike
  async like(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for camera shutter
  async cameraShutter(): Promise<void> {
    await this.medium();
  }

  // Haptic feedback for photo selection
  async photoSelection(): Promise<void> {
    await this.selection();
  }

  // Haptic feedback for location selection
  async locationSelection(): Promise<void> {
    await this.selection();
  }

  // Haptic feedback for note creation
  async noteCreated(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for note deletion
  async noteDeleted(): Promise<void> {
    await this.warning();
  }

  // Haptic feedback for search results
  async searchResults(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for empty state
  async emptyState(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for loading state
  async loading(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for completion
  async completion(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for validation errors
  async validationError(): Promise<void> {
    await this.error();
  }

  // Haptic feedback for network errors
  async networkError(): Promise<void> {
    await this.error();
  }

  // Haptic feedback for permission requests
  async permissionRequest(): Promise<void> {
    await this.medium();
  }

  // Haptic feedback for permission granted
  async permissionGranted(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for permission denied
  async permissionDenied(): Promise<void> {
    await this.warning();
  }

  // Haptic feedback for social interactions
  async socialInteraction(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for notifications
  async notification(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for settings changes
  async settingChanged(): Promise<void> {
    await this.selection();
  }

  // Haptic feedback for profile updates
  async profileUpdated(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for logout
  async logout(): Promise<void> {
    await this.warning();
  }

  // Haptic feedback for login
  async login(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for registration
  async registration(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for password reset
  async passwordReset(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for email verification
  async emailVerification(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for account deletion
  async accountDeleted(): Promise<void> {
    await this.heavy();
  }

  // Haptic feedback for data backup
  async dataBackup(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for data restore
  async dataRestore(): Promise<void> {
    await this.success();
  }

  // Haptic feedback for sync
  async sync(): Promise<void> {
    await this.light();
  }

  // Haptic feedback for offline mode
  async offlineMode(): Promise<void> {
    await this.warning();
  }

  // Haptic feedback for online mode
  async onlineMode(): Promise<void> {
    await this.success();
  }
}

export const hapticUtils = new HapticUtils();
export default hapticUtils;
