import { Note, SocialInteraction } from '../types';
import notificationService from './notificationService';
import storageService from './storageService';

class SocialService {
  private readonly SOCIAL_INTERACTIONS_KEY = 'social_interactions';
  private readonly PUBLIC_NOTES_KEY = 'public_notes';

  // Like a note
  async likeNote(noteId: string, userId: string, noteTitle: string): Promise<boolean> {
    try {
      // Get current note
      const notes = await storageService.getNotes();
      const noteIndex = notes.findIndex((n: Note) => n.id === noteId);
      
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      const note = notes[noteIndex];
      
      // Check if already liked
      if (note.likedBy.includes(userId)) {
        // Unlike
        note.likes = Math.max(0, note.likes - 1);
        note.likedBy = note.likedBy.filter((id: string) => id !== userId);
      } else {
        // Like
        note.likes += 1;
        note.likedBy.push(userId);
        
        // Send notification if it's not the user's own note
        if (note.userId !== userId) {
          await notificationService.likeNotification(noteId, noteTitle, userId);
        }
      }

      // Update note
      notes[noteIndex] = note;
      await storageService.storeNotes(notes);

      // Store social interaction
      await this.storeSocialInteraction({
        noteId,
        userId,
        type: 'like',
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Like note error:', error);
      return false;
    }
  }

  // Get public notes
  async getPublicNotes(): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      return notes.filter((note: Note) => note.isPublic);
    } catch (error) {
      console.error('Get public notes error:', error);
      return [];
    }
  }

  // Get notes near a location
  async getNotesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      const publicNotes = notes.filter((note: Note) => note.isPublic && note.location);
      
              return publicNotes.filter((note: Note) => {
        if (!note.location) return false;
        
        const distance = this.calculateDistance(
          latitude,
          longitude,
          note.location.latitude,
          note.location.longitude
        );
        
        return distance <= radiusKm;
      });
    } catch (error) {
      console.error('Get notes near location error:', error);
      return [];
    }
  }

  // Get trending notes (most liked)
  async getTrendingNotes(limit: number = 10): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      const publicNotes = notes.filter((note: Note) => note.isPublic);
      
      return publicNotes
        .sort((a: Note, b: Note) => b.likes - a.likes)
        .slice(0, limit);
    } catch (error) {
      console.error('Get trending notes error:', error);
      return [];
    }
  }

  // Get recent public notes
  async getRecentPublicNotes(limit: number = 20): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      const publicNotes = notes.filter((note: Note) => note.isPublic);
      
      return publicNotes
        .sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Get recent public notes error:', error);
      return [];
    }
  }

  // Get user's public notes
  async getUserPublicNotes(userId: string): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      return notes.filter(note => note.userId === userId && note.isPublic);
    } catch (error) {
      console.error('Get user public notes error:', error);
      return [];
    }
  }

  // Get social interactions for a note
  async getNoteInteractions(noteId: string): Promise<SocialInteraction[]> {
    try {
      const interactions = await this.getSocialInteractions();
      return interactions.filter(interaction => interaction.noteId === noteId);
    } catch (error) {
      console.error('Get note interactions error:', error);
      return [];
    }
  }

  // Get user's social interactions
  async getUserInteractions(userId: string): Promise<SocialInteraction[]> {
    try {
      const interactions = await this.getSocialInteractions();
      return interactions.filter(interaction => interaction.userId === userId);
    } catch (error) {
      console.error('Get user interactions error:', error);
      return [];
    }
  }

  // Store social interaction
  private async storeSocialInteraction(interaction: SocialInteraction): Promise<void> {
    try {
      const interactions = await this.getSocialInteractions();
      interactions.push(interaction);
      await storageService.storeData(this.SOCIAL_INTERACTIONS_KEY, interactions);
    } catch (error) {
      console.error('Store social interaction error:', error);
    }
  }

  // Get all social interactions
  private async getSocialInteractions(): Promise<SocialInteraction[]> {
    try {
      const interactions = await storageService.getData(this.SOCIAL_INTERACTIONS_KEY);
      return interactions || [];
    } catch (error) {
      console.error('Get social interactions error:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get social statistics
  async getSocialStats(userId: string): Promise<{
    totalLikes: number;
    totalPublicNotes: number;
    followers: number;
    following: number;
  }> {
    try {
      const notes = await storageService.getNotes();
      const userNotes = notes.filter((note: Note) => note.userId === userId);
      const publicNotes = userNotes.filter((note: Note) => note.isPublic);
      
      const totalLikes = publicNotes.reduce((sum: number, note: Note) => sum + note.likes, 0);
      
      return {
        totalLikes,
        totalPublicNotes: publicNotes.length,
        followers: 0, // Placeholder for future implementation
        following: 0, // Placeholder for future implementation
      };
    } catch (error) {
      console.error('Get social stats error:', error);
      return {
        totalLikes: 0,
        totalPublicNotes: 0,
        followers: 0,
        following: 0,
      };
    }
  }

  // Search public notes
  async searchPublicNotes(query: string): Promise<Note[]> {
    try {
      const notes = await storageService.getNotes();
      const publicNotes = notes.filter((note: Note) => note.isPublic);
      
      if (!query.trim()) {
        return publicNotes;
      }
      
      const searchTerm = query.toLowerCase();
      return publicNotes.filter((note: Note) => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.category.toLowerCase().includes(searchTerm) ||
        note.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Search public notes error:', error);
      return [];
    }
  }
}

export const socialService = new SocialService();
export default socialService;
