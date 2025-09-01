export const API_CONFIG = {
  BASE_URL: 'https://jsonplaceholder.typicode.com', // Using a demo API for testing
  ENDPOINTS: {
    LOGIN: '/users/1', // Mock endpoint - returns user data
    REGISTER: '/users', // Mock endpoint - creates user
    NOTES: '/posts', // Mock endpoint - returns posts as notes
    NOTE: (id: string) => `/posts/${id}`,
  },
  TIMEOUT: 10000,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  NOTES_CACHE: 'notes_cache',
  OFFLINE_OPERATIONS: 'offline_operations',
  USER_PREFERENCES: 'user_preferences',
};

export const CATEGORIES = [
  'Personal',
  'Work',
  'Ideas',
  'Shopping',
  'Health',
  'Travel',
  'Other',
];

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
