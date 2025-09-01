export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  profilePicture?: string;
  location?: Location;
  preferences?: UserPreferences;
  bio?: string;
  isPublic?: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  publicNotes: boolean;
  locationSharing: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  location?: Location;
  images?: NoteImage[];
  voiceMemo?: string;
  tags?: string[];
  likes: number;
  likedBy: string[];
  richContent?: RichContent;
}

export interface NoteImage {
  id: string;
  uri: string;
  thumbnail?: string;
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  location?: Location;
  timestamp: string;
  size: number;
  width: number;
  height: number;
}

export interface RichContent {
  text: string;
  formatting: TextFormatting[];
  attachments: Attachment[];
}

export interface TextFormatting {
  type: 'bold' | 'italic' | 'underline' | 'highlight';
  start: number;
  end: number;
}

export interface Attachment {
  type: 'image' | 'voice' | 'file';
  uri: string;
  name: string;
  size: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface NotesState {
  notes: Note[];
  publicNotes: Note[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  selectedCategory?: string;
  searchQuery?: string;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
}

export interface OfflineOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Partial<Note>;
  timestamp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ProfileSetupData {
  name: string;
  bio?: string;
  profilePicture?: string;
  location?: Location;
  preferences: UserPreferences;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'mention';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
}

export interface SocialInteraction {
  noteId: string;
  userId: string;
  type: 'like' | 'comment';
  timestamp: string;
}

export const CATEGORIES = [
  'Personal',
  'Work',
  'Ideas',
  'Shopping',
  'Health',
  'Travel',
  'Other',
] as const;

export const THEMES = ['light', 'dark', 'auto'] as const;
