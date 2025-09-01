import { API_CONFIG } from '../constants/api';
import { ApiResponse, Note, OfflineOperation } from '../types';
import authService from './authService';
import networkService from './networkService';
import storageService from './storageService';

class NotesService {
  private baseUrl = API_CONFIG.BASE_URL;

  // Get all notes (with offline support)
  async getNotes(): Promise<Note[]> {
    try {
      console.log('getNotes called');
      
      // Always get cached notes first (includes both API notes and locally created notes)
      const cachedNotes = await storageService.getCachedNotes();
      console.log('getNotes - cached notes count:', cachedNotes.length);
      console.log('getNotes - cached notes:', cachedNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
      
      // Only fetch from API if online and we don't have any cached notes
      if (networkService.isOnline() && cachedNotes.length === 0) {
        console.log('No cached notes, fetching from API...');
        const apiNotes = await this.fetchNotesFromAPI();
        console.log('API notes fetched:', apiNotes.length);
        // Cache the API notes locally
        await storageService.cacheNotes(apiNotes);
        return apiNotes;
      }
      
      // Return cached notes (includes both API notes and locally created notes)
      return cachedNotes;
    } catch (error) {
      console.error('Get notes error:', error);
      // Fallback to cached notes
      const cachedNotes = await storageService.getCachedNotes();
      return cachedNotes;
    }
  }

  // Get notes with pagination
  async getNotesPaginated(page: number = 1, limit: number = 20): Promise<{ notes: Note[], hasMore: boolean, total: number }> {
    try {
      if (networkService.isOnline()) {
        // Try to fetch from API with pagination
        const result = await this.fetchNotesFromAPIWithPagination(page, limit);
        // Cache the notes locally
        await storageService.cacheNotes(result.notes);
        return result;
      } else {
        // Return cached notes with pagination if offline
        const cachedNotes = await storageService.getCachedNotes();
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedNotes = cachedNotes.slice(startIndex, endIndex);
        const hasMore = endIndex < cachedNotes.length;
        
        return {
          notes: paginatedNotes,
          hasMore,
          total: cachedNotes.length
        };
      }
    } catch (error) {
      console.error('Get notes paginated error:', error);
      // Fallback to cached notes with pagination
      const cachedNotes = await storageService.getCachedNotes();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotes = cachedNotes.slice(startIndex, endIndex);
      const hasMore = endIndex < cachedNotes.length;
      
      return {
        notes: paginatedNotes,
        hasMore,
        total: cachedNotes.length
      };
    }
  }

    // Fetch notes from API
  private async fetchNotesFromAPI(): Promise<Note[]> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    // For demo purposes, we'll fetch from the mock API
    // In a real app, this would include proper authentication headers
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NOTES}`);

    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }

    const mockPosts = await response.json();
    
    // Convert mock posts to notes format
    const currentUser = await authService.getCurrentUser();
    const notes: Note[] = mockPosts.slice(0, 10).map((post: any, index: number) => ({
      id: post.id.toString(),
      title: post.title || `Note ${index + 1}`,
      content: post.body || 'No content available',
      category: 'Personal', // Default category
      isFavorite: false, // Default to not favorite
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentUser?.id || '1',
    }));

    return notes;
  }

  // Fetch notes from API with pagination
  private async fetchNotesFromAPIWithPagination(page: number, limit: number): Promise<{ notes: Note[], hasMore: boolean, total: number }> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    // For demo purposes, we'll fetch from the mock API with pagination
    // In a real app, this would include proper authentication headers and pagination parameters
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NOTES}?_page=${page}&_limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }

    const mockPosts = await response.json();
    
    // Convert mock posts to notes format
    const currentUser = await authService.getCurrentUser();
    const notes: Note[] = mockPosts.map((post: any, index: number) => ({
      id: post.id.toString(),
      title: post.title || `Note ${index + 1}`,
      content: post.body || 'No content available',
      category: 'Personal', // Default category
      isFavorite: false, // Default to not favorite
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentUser?.id || '1',
    }));

    // For demo purposes, we'll simulate pagination
    // In a real app, the API would return pagination metadata
    const total = 100; // Mock total count
    const hasMore = (page * limit) < total;

    return {
      notes,
      hasMore,
      total
    };
  }

  // Create note (with offline support)
  async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Note> {
    try {
      console.log('=== CREATE NOTE START ===');
      console.log('Creating note with data:', noteData);
      
      // Since we're using a mock API that doesn't support POST, we'll create notes locally
      const currentUser = await authService.getCurrentUser();
      console.log('Current user:', currentUser);
      
      const newNote: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...noteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser?.id || '1',
      };

      console.log('Created new note:', newNote);

      // Add to local cache
      await this.addNoteToCache(newNote);
      console.log('Note added to cache successfully');
      
      // If online, queue for sync (though the mock API won't actually create it)
      if (networkService.isOnline()) {
        const offlineOp: OfflineOperation = {
          id: `offline_${Date.now()}_${Math.random()}`,
          type: 'CREATE',
          data: noteData,
          timestamp: Date.now(),
        };
        await storageService.addOfflineOperation(offlineOp);
        console.log('Offline operation queued');
      }

      // Verify the note was actually saved
      await this.debugStorage();
      console.log('=== CREATE NOTE END ===');

      return newNote;
    } catch (error) {
      console.error('Create note error:', error);
      throw error;
    }
  }

  // Create note via API
  private async createNoteViaAPI(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Note> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NOTES}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    const data: ApiResponse<Note> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to create note');
    }

    if (!data.data) {
      throw new Error('Invalid response from server');
    }

    return data.data;
  }

  // Update note (with offline support)
  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    try {
      if (networkService.isOnline()) {
        // Update note via API
        const updatedNote = await this.updateNoteViaAPI(id, updates);
        // Update local cache
        await this.updateNoteInCache(updatedNote);
        return updatedNote;
      } else {
        // Queue operation for later sync
        const offlineOp: OfflineOperation = {
          id: `offline_${Date.now()}_${Math.random()}`,
          type: 'UPDATE',
          data: { id, ...updates },
          timestamp: Date.now(),
        };
        await storageService.addOfflineOperation(offlineOp);

        // Update local cache immediately
        const cachedNotes = await storageService.getCachedNotes();
        const noteIndex = cachedNotes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
          cachedNotes[noteIndex] = {
            ...cachedNotes[noteIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          await storageService.cacheNotes(cachedNotes);
          return cachedNotes[noteIndex];
        }

        throw new Error('Note not found');
      }
    } catch (error) {
      console.error('Update note error:', error);
      throw error;
    }
  }

  // Update note via API
  private async updateNoteViaAPI(id: string, updates: Partial<Note>): Promise<Note> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NOTE(id)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data: ApiResponse<Note> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to update note');
    }

    if (!data.data) {
      throw new Error('Invalid response from server');
    }

    return data.data;
  }

  // Delete note (with offline support)
  async deleteNote(id: string): Promise<void> {
    try {
      if (networkService.isOnline()) {
        // Delete note via API
        await this.deleteNoteViaAPI(id);
        // Remove from local cache
        await this.removeNoteFromCache(id);
      } else {
        // Queue operation for later sync
        const offlineOp: OfflineOperation = {
          id: `offline_${Date.now()}_${Math.random()}`,
          type: 'DELETE',
          data: { id },
          timestamp: Date.now(),
        };
        await storageService.addOfflineOperation(offlineOp);

        // Remove from local cache immediately
        await this.removeNoteFromCache(id);
      }
    } catch (error) {
      console.error('Delete note error:', error);
      throw error;
    }
  }

  // Delete note via API
  private async deleteNoteViaAPI(id: string): Promise<void> {
    const token = await authService.getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NOTE(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data: ApiResponse<any> = await response.json();
      throw new Error(data.error || data.message || 'Failed to delete note');
    }
  }

  // Sync offline operations when back online
  async syncOfflineOperations(): Promise<void> {
    try {
      console.log('Starting offline operations sync...');
      if (networkService.isOffline()) {
        console.log('Still offline, skipping sync');
        return; // Still offline
      }

      const offlineOps = await storageService.getOfflineOperations();
      console.log('Offline operations to sync:', offlineOps.length);
      
      if (offlineOps.length === 0) {
        console.log('No operations to sync');
        return; // No operations to sync
      }

      for (const operation of offlineOps) {
        try {
          console.log('Processing operation:', operation.id, operation.type);
          
          // Since we're using a mock API that doesn't support POST/PUT/DELETE,
          // we'll just mark operations as "synced" without actually calling the API
          switch (operation.type) {
            case 'CREATE':
              console.log('Marking CREATE operation as synced (mock API)');
              // Don't call createNoteViaAPI since it will fail
              break;
            case 'UPDATE':
              console.log('Marking UPDATE operation as synced (mock API)');
              // Don't call updateNoteViaAPI since it will fail
              break;
            case 'DELETE':
              console.log('Marking DELETE operation as synced (mock API)');
              // Don't call deleteNoteViaAPI since it will fail
              break;
          }
          
          // Remove operation from queue since we're treating it as "synced"
          await storageService.removeOfflineOperation(operation.id);
          console.log('Operation removed from queue:', operation.id);
        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          // Keep failed operations in queue for retry
        }
      }

      console.log('Offline operations sync completed');
    } catch (error) {
      console.error('Sync offline operations error:', error);
    }
  }

  // Helper methods for cache management
  private async addNoteToCache(note: Note): Promise<void> {
    console.log('=== ADD NOTE TO CACHE START ===');
    console.log('Adding note to cache:', note.id);
    
    const cachedNotes = await storageService.getCachedNotes();
    console.log('Current cached notes count:', cachedNotes.length);
    console.log('Current cached notes:', cachedNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
    
    // Check if note already exists
    const existingNoteIndex = cachedNotes.findIndex(n => n.id === note.id);
    if (existingNoteIndex !== -1) {
      console.log('Note already exists, updating...');
      cachedNotes[existingNoteIndex] = note;
    } else {
      console.log('Adding new note to cache...');
      cachedNotes.push(note);
    }
    
    console.log('Notes after adding/updating:', cachedNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
    
    await storageService.cacheNotes(cachedNotes);
    console.log('Note cached successfully');
    
    // Verify the note was actually saved
    const verifyNotes = await storageService.getCachedNotes();
    console.log('Verification - cached notes count:', verifyNotes.length);
    console.log('Verification - cached notes:', verifyNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
    console.log('=== ADD NOTE TO CACHE END ===');
  }

  private async updateNoteInCache(updatedNote: Note): Promise<void> {
    const cachedNotes = await storageService.getCachedNotes();
    const noteIndex = cachedNotes.findIndex(note => note.id === updatedNote.id);
    if (noteIndex !== -1) {
      cachedNotes[noteIndex] = updatedNote;
      await storageService.cacheNotes(cachedNotes);
    }
  }

  private async removeNoteFromCache(id: string): Promise<void> {
    const cachedNotes = await storageService.getCachedNotes();
    const filteredNotes = cachedNotes.filter(note => note.id !== id);
    await storageService.cacheNotes(filteredNotes);
  }

  // Search notes (works offline)
  async searchNotes(query: string): Promise<Note[]> {
    const notes = await this.getNotes();
    if (!query.trim()) {
      return notes;
    }

    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get notes by category (works offline)
  async getNotesByCategory(category: string): Promise<Note[]> {
    const notes = await this.getNotes();
    if (!category || category === 'All') {
      return notes;
    }
    return notes.filter(note => note.category === category);
  }

  // Debug function to check storage
  async debugStorage(): Promise<void> {
    console.log('=== DEBUG STORAGE ===');
    const cachedNotes = await storageService.getCachedNotes();
    console.log('Cached notes count:', cachedNotes.length);
    console.log('Cached notes:', cachedNotes.map(n => ({ id: n.id, title: n.title, category: n.category })));
    
    const offlineOps = await storageService.getOfflineOperations();
    console.log('Offline operations count:', offlineOps.length);
    console.log('Offline operations:', offlineOps.map(op => ({ id: op.id, type: op.type, data: op.data })));
    console.log('=== END DEBUG ===');
  }

  // Test function to create a test note
  async createTestNote(): Promise<Note> {
    console.log('=== CREATING TEST NOTE ===');
    
    // First test AsyncStorage directly
    await storageService.testAsyncStorage();
    
    const testNoteData = {
      title: 'Test Work Note',
      content: 'This is a test note for Work category',
      category: 'Work',
      isFavorite: false,
      isPublic: false,
      likes: 0,
      likedBy: [],
    };
    
    const testNote = await this.createNote(testNoteData);
    console.log('Test note created:', testNote);
    return testNote;
  }

  // Get favorite notes (works offline)
  async getFavoriteNotes(): Promise<Note[]> {
    const notes = await this.getNotes();
    return notes.filter(note => note.isFavorite);
  }
}

export const notesService = new NotesService();
export default notesService;
