import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomInput } from '../../components/common/CustomInput';
import { VALIDATION_RULES } from '../../constants/api';
import { useAuth } from '../../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [formData]);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    };

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
    }

    setValidationErrors(errors);
    setIsFormValid(!errors.email && !errors.password && formData.email.trim() !== '' && formData.password.trim() !== '');
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Navigation will be handled by the auth context
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'This feature is not implemented yet.');
  };

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
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Sign in to your account to continue
            </Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={validationErrors.password}
              required
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!isFormValid || isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <CustomButton
              title="Forgot Password?"
              onPress={handleForgotPassword}
              variant="outline"
              size="small"
              fullWidth
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Don't have an account?{' '}
            </Text>
            <CustomButton
              title="Sign Up"
              onPress={handleRegister}
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
  loginButton: {
    marginTop: 16,
  },
  forgotButton: {
    marginTop: 8,
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
