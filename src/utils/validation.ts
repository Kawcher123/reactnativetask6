export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidation {
  [key: string]: ValidationRule;
}

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation pattern (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Common validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: EMAIL_PATTERN,
    custom: (value: string) => {
      if (!value) return 'Email is required';
      if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email address';
      return null;
    },
  },
  password: {
    required: true,
    minLength: 8,
    pattern: PASSWORD_PATTERN,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters long';
      if (!PASSWORD_PATTERN.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return null;
    },
  },
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: any) => {
      if (!value) return 'Please confirm your password';
      if (formData?.password && value !== formData.password) {
        return 'Passwords do not match';
      }
      return null;
    },
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (!value) return 'Name is required';
      if (value.length < 2) return 'Name must be at least 2 characters long';
      if (value.length > 50) return 'Name must be less than 50 characters';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
      return null;
    },
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 100,
    custom: (value: string) => {
      if (!value) return 'Title is required';
      if (value.length > 100) return 'Title must be less than 100 characters';
      return null;
    },
  },
  content: {
    required: true,
    minLength: 1,
    maxLength: 10000,
    custom: (value: string) => {
      if (!value) return 'Content is required';
      if (value.length > 10000) return 'Content must be less than 10,000 characters';
      return null;
    },
  },
  bio: {
    maxLength: 500,
    custom: (value: string) => {
      if (value && value.length > 500) return 'Bio must be less than 500 characters';
      return null;
    },
  },
  category: {
    required: true,
    custom: (value: string) => {
      if (!value) return 'Please select a category';
      return null;
    },
  },
  tags: {
    custom: (value: string[]) => {
      if (value && value.length > 10) return 'You can add up to 10 tags';
      if (value && value.some(tag => tag.length > 20)) {
        return 'Each tag must be less than 20 characters';
      }
      return null;
    },
  },
};

// Validate a single field
export function validateField(
  fieldName: string,
  value: any,
  rules: ValidationRule,
  formData?: any
): string[] {
  const errors: string[] = [];

  // Required validation
  if (rules.required && !value) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return errors;
  }

  // Min length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
  }

  // Max length validation
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    errors.push(`${fieldName} must be less than ${rules.maxLength} characters`);
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(`${fieldName} format is invalid`);
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value, formData);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

// Validate entire form
export function validateForm(
  formData: any,
  validationRules: FieldValidation
): ValidationResult {
  const errors: string[] = [];
  let isValid = true;

  Object.keys(validationRules).forEach(fieldName => {
    const fieldErrors = validateField(
      fieldName,
      formData[fieldName],
      validationRules[fieldName],
      formData
    );

    if (fieldErrors.length > 0) {
      errors.push(...fieldErrors);
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Real-time validation for input fields
export function getFieldError(
  fieldName: string,
  value: any,
  rules: ValidationRule,
  formData?: any,
  touched?: boolean
): string | null {
  if (!touched) return null;
  
  const errors = validateField(fieldName, value, rules, formData);
  return errors.length > 0 ? errors[0] : null;
}

// Validate note form
export function validateNoteForm(formData: any): ValidationResult {
  return validateForm(formData, {
    title: VALIDATION_RULES.title,
    content: VALIDATION_RULES.content,
    category: VALIDATION_RULES.category,
    tags: VALIDATION_RULES.tags,
  });
}

// Validate profile form
export function validateProfileForm(formData: any): ValidationResult {
  return validateForm(formData, {
    name: VALIDATION_RULES.name,
    bio: VALIDATION_RULES.bio,
  });
}

// Validate registration form
export function validateRegistrationForm(formData: any): ValidationResult {
  return validateForm(formData, {
    name: VALIDATION_RULES.name,
    email: VALIDATION_RULES.email,
    password: VALIDATION_RULES.password,
    confirmPassword: VALIDATION_RULES.confirmPassword,
  });
}

// Validate login form
export function validateLoginForm(formData: any): ValidationResult {
  return validateForm(formData, {
    email: VALIDATION_RULES.email,
    password: VALIDATION_RULES.password,
  });
}

// Sanitize input (remove extra spaces, etc.)
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

// Validate image file
export function validateImageFile(file: any): string[] {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    errors.push('Please select an image');
    return errors;
  }

  if (file.size && file.size > maxSize) {
    errors.push('Image size must be less than 10MB');
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    errors.push('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
  }

  return errors;
}

// Validate location coordinates
export function validateLocation(location: any): string[] {
  const errors: string[] = [];

  if (!location) {
    errors.push('Location is required');
    return errors;
  }

  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    errors.push('Invalid location coordinates');
  }

  if (location.latitude < -90 || location.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (location.longitude < -180 || location.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  return errors;
}
