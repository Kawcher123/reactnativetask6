import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/api';
import { Note, OfflineOperation, User } from '../types';

class StorageService {
  // Authentication storage
  async storeAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async storeUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  // Notes cache storage
  async cacheNotes(notes: Note[]): Promise<void> {
    try {
      console.log('StorageService: Caching notes, count:', notes.length);
      console.log('StorageService: Notes to cache:', notes.map(n => ({ id: n.id, title: n.title, category: n.category })));
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES_CACHE, JSON.stringify(notes));
      console.log('StorageService: Notes cached successfully');
    } catch (error) {
      console.error('Error caching notes:', error);
      throw error;
    }
  }

  async getCachedNotes(): Promise<Note[]> {
    try {
      const notesData = await AsyncStorage.getItem(STORAGE_KEYS.NOTES_CACHE);
      const notes = notesData ? JSON.parse(notesData) : [];
      console.log('StorageService: Retrieved cached notes, count:', notes.length);
      console.log('StorageService: Cached notes:', notes.map(n => ({ id: n.id, title: n.title, category: n.category })));
      return notes;
    } catch (error) {
      console.error('Error getting cached notes:', error);
      return [];
    }
  }

  async clearNotesCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.NOTES_CACHE);
    } catch (error) {
      console.error('Error clearing notes cache:', error);
      throw error;
    }
  }

  // Offline operations queue
  async addOfflineOperation(operation: OfflineOperation): Promise<void> {
    try {
      const operations = await this.getOfflineOperations();
      operations.push(operation);
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_OPERATIONS,
        JSON.stringify(operations)
      );
    } catch (error) {
      console.error('Error adding offline operation:', error);
      throw error;
    }
  }

  async getOfflineOperations(): Promise<OfflineOperation[]> {
    try {
      const operationsData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_OPERATIONS);
      return operationsData ? JSON.parse(operationsData) : [];
    } catch (error) {
      console.error('Error getting offline operations:', error);
      return [];
    }
  }

  async clearOfflineOperations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_OPERATIONS);
    } catch (error) {
      console.error('Error clearing offline operations:', error);
      throw error;
    }
  }

  async removeOfflineOperation(operationId: string): Promise<void> {
    try {
      const operations = await this.getOfflineOperations();
      const filteredOperations = operations.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_OPERATIONS,
        JSON.stringify(filteredOperations)
      );
    } catch (error) {
      console.error('Error removing offline operation:', error);
      throw error;
    }
  }

  // User preferences
  async storeUserPreferences(preferences: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error storing user preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const preferencesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return preferencesData ? JSON.parse(preferencesData) : {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  // Clear all data (logout)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Generic data storage methods
  async storeData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  async getData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  // Test function to directly check AsyncStorage
  async testAsyncStorage(): Promise<void> {
    console.log('=== TESTING ASYNC STORAGE ===');
    try {
      // Test writing a simple note directly
      const testNote = {
        id: 'test_123',
        title: 'Test Note',
        category: 'Work',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: '1',
        isFavorite: false,
        isPublic: false,
        likes: 0,
        likedBy: [],
      };
      
      console.log('Writing test note directly to AsyncStorage...');
      await AsyncStorage.setItem('TEST_NOTE', JSON.stringify(testNote));
      console.log('Test note written successfully');
      
      // Read it back
      const readTestNote = await AsyncStorage.getItem('TEST_NOTE');
      console.log('Read test note:', readTestNote);
      
      // Test the notes cache key
      console.log('Testing notes cache key:', STORAGE_KEYS.NOTES_CACHE);
      const currentNotes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES_CACHE);
      console.log('Current notes in AsyncStorage:', currentNotes);
      
      // Write some test notes to the cache
      const testNotes = [testNote];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES_CACHE, JSON.stringify(testNotes));
      console.log('Test notes written to cache');
      
      // Read them back
      const readNotes = await AsyncStorage.getItem(STORAGE_KEYS.NOTES_CACHE);
      console.log('Read notes from cache:', readNotes);
      
    } catch (error) {
      console.error('AsyncStorage test error:', error);
    }
    console.log('=== END ASYNC STORAGE TEST ===');
  }

  // Notes storage methods (alias for cached notes)
  async getNotes(): Promise<Note[]> {
    return this.getCachedNotes();
  }

  async storeNotes(notes: Note[]): Promise<void> {
    return this.cacheNotes(notes);
  }
}

export const storageService = new StorageService();
export default storageService;
