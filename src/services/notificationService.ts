import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Get push token
      if (Device.isDevice) {
        this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        })).data;
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Initialize notifications error:', error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Schedule local notification error:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Get badge count error:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Set badge count error:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Clear badge error:', error);
    }
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Send push notification error:', error);
      throw error;
    }
  }

  async likeNotification(
    noteId: string,
    noteTitle: string,
    likedBy: string
  ): Promise<void> {
    try {
      const title = 'New Like! ❤️';
      const body = `${likedBy} liked your note "${noteTitle}"`;
      
      await this.scheduleLocalNotification(title, body, {
        type: 'like',
        noteId,
        likedBy,
      });
    } catch (error) {
      console.error('Like notification error:', error);
    }
  }

  async commentNotification(
    noteId: string,
    noteTitle: string,
    commentedBy: string
  ): Promise<void> {
    try {
      const title = 'New Comment! 💬';
      const body = `${commentedBy} commented on your note "${noteTitle}"`;
      
      await this.scheduleLocalNotification(title, body, {
        type: 'comment',
        noteId,
        commentedBy,
      });
    } catch (error) {
      console.error('Comment notification error:', error);
    }
  }

  async mentionNotification(
    noteId: string,
    noteTitle: string,
    mentionedBy: string
  ): Promise<void> {
    try {
      const title = 'You were mentioned! 👋';
      const body = `${mentionedBy} mentioned you in "${noteTitle}"`;
      
      await this.scheduleLocalNotification(title, body, {
        type: 'mention',
        noteId,
        mentionedBy,
      });
    } catch (error) {
      console.error('Mention notification error:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Promise<() => void> {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  }

  async addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Promise<() => void> {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
