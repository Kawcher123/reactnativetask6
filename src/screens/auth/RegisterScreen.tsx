import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { VALIDATION_RULES } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  });

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: '',
    };

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
    } else if (!VALIDATION_RULES.PASSWORD_REGEX.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms of service';
    }

    setValidationErrors(errors);
    setIsFormValid(
      !errors.name &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      !errors.acceptTerms &&
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.confirmPassword.trim() !== '' &&
      formData.acceptTerms
    );
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      // Store registration data temporarily for profile setup
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      
      // Navigate to profile setup instead of calling register directly
      router.push({
        pathname: '/profile-setup',
        params: { registrationData: JSON.stringify(registrationData) }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to proceed to profile setup');
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const getPasswordStrength = (password: string): { text: string; color: string } => {
    if (password.length === 0) return { text: '', color: colors.icon };
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return { text: 'Weak', color: '#ff4444' };
    }
    if (VALIDATION_RULES.PASSWORD_REGEX.test(password)) {
      return { text: 'Strong', color: '#4CAF50' };
    }
    return { text: 'Medium', color: '#FF9800' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Sign up to get started with your notes
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={validationErrors.name}
              required
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={validationErrors.email}
              required
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <CustomInput
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={validationErrors.password}
              required
              secureTextEntry
              returnKeyType="next"
            />

            {formData.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}

            <CustomInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={validationErrors.confirmPassword}
              required
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <View style={styles.termsContainer}>
              <View style={styles.termsRow}>
                <Switch
                  value={formData.acceptTerms}
                  onValueChange={(value) => handleInputChange('acceptTerms', value)}
                  trackColor={{ false: colors.border, true: colors.tint }}
                  thumbColor={formData.acceptTerms ? '#fff' : colors.icon}
                />
                <Text style={[styles.termsText, { color: colors.text }]}>
                  I accept the{' '}
                  <Text style={[styles.termsLink, { color: colors.tint }]}>
                    Terms of Service
                  </Text>
                </Text>
              </View>
              {validationErrors.acceptTerms && (
                <Text style={styles.termsError}>{validationErrors.acceptTerms}</Text>
              )}
            </View>

            <CustomButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!isFormValid || isLoading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Already have an account?{' '}
            </Text>
            <CustomButton
              title="Sign In"
              onPress={handleBackToLogin}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  form: {
    marginBottom: 32,
  },
  passwordStrength: {
    marginTop: -8,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    fontFamily: 'DM Sans',
  },
  termsLink: {
    fontWeight: '600',
  },
  termsError: {
    fontSize: 12,
    color: '#ff4444',
    marginLeft: 44,
    fontFamily: 'DM Sans',
  },
  registerButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
});
