import { API_CONFIG } from '../constants/api';
import { LoginCredentials, RegisterCredentials, User } from '../types';
import networkService from './networkService';
import storageService from './storageService';

class AuthService {
  private baseUrl = API_CONFIG.BASE_URL;

  // Login user
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      if (networkService.isOffline()) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // For demo purposes, we'll simulate a successful login with mock data
      // In a real app, this would be a POST request to your actual API
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LOGIN}`);
      
      if (!response.ok) {
        throw new Error('Login failed - please check your credentials');
      }

      const mockUserData = await response.json();
      
      // Create a mock user object that matches our User interface
      const user: User = {
        id: mockUserData.id.toString(),
        name: mockUserData.name || 'Demo User',
        email: credentials.email, // Use the email from credentials
        token: `mock_token_${Date.now()}`, // Generate a mock token
      };

      // Store user data and token locally
      await storageService.storeUserData(user);
      await storageService.storeAuthToken(user.token);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      if (networkService.isOffline()) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // For demo purposes, we'll simulate a successful registration
      // In a real app, this would be a POST request to your actual API
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed - please try again');
      }

      const mockUserData = await response.json();
      
      // Create a mock user object that matches our User interface
      const user: User = {
        id: mockUserData.id?.toString() || `user_${Date.now()}`,
        name: credentials.name,
        email: credentials.email,
        token: `mock_token_${Date.now()}`,
      };

      // Store user data and token locally
      await storageService.storeUserData(user);
      await storageService.storeAuthToken(user.token);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Logout useri
  async logout(): Promise<void> {
    try {
      // Clear all local data
      await storageService.clearAllData();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await storageService.getAuthToken();
      const userData = await storageService.getUserData();
      return !!(token && userData);
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      return await storageService.getUserData();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await storageService.getAuthToken();
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  // Refresh auth token (placeholder for future implementation)
  async refreshToken(): Promise<string | null> {
    try {
      // This would typically make a request to refresh the token
      // For now, just return the current token
      return await this.getAuthToken();
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }

  // Validate token (placeholder for future implementation)
  async validateToken(token: string): Promise<boolean> {
    try {
      // This would typically make a request to validate the token
      // For now, just check if token exists
      return !!token;
    } catch (error) {
      console.error('Validate token error:', error);
      return false;
    }
  }

  // Auto-login from stored credentials
  async autoLogin(): Promise<User | null> {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        return null;
      }

      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }

      // Validate token (in a real app, you'd make an API call)
      const isValid = await this.validateToken(user.token);
      if (!isValid) {
        await this.logout();
        return null;
      }

      return user;
    } catch (error) {
      console.error('Auto-login error:', error);
      await this.logout();
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
