import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const buttonStyles = [
    styles.button,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.tint,
          borderColor: colors.tint,
        };
      case 'secondary':
        return {
          backgroundColor: colors.background,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.tint,
        };
      case 'danger':
        return {
          backgroundColor: '#ff4444',
          borderColor: '#ff4444',
        };
      default:
        return {
          backgroundColor: colors.tint,
          borderColor: colors.tint,
        };
    }
  };

  const getTextColors = () => {
    switch (variant) {
      case 'primary':
        return { color: '#ffffff' };
      case 'secondary':
        return { color: colors.text };
      case 'outline':
        return { color: colors.tint };
      case 'danger':
        return { color: '#ffffff' };
      default:
        return { color: '#ffffff' };
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, getButtonColors()]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.tint : '#ffffff'}
        />
      ) : (
        <Text style={[textStyles, getTextColors()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Size variants
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  // Variant styles
  primary: {
    // Default primary styles
  },
  secondary: {
    // Default secondary styles
  },
  outline: {
    // Default outline styles
  },
  danger: {
    // Default danger styles
  },
  // Text sizes
  smallText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediumText: {
    fontSize: 16,
    fontWeight: '600',
  },
  largeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Variant text styles
  primaryText: {
    // Default primary text styles
  },
  secondaryText: {
    // Default secondary text styles
  },
  outlineText: {
    // Default outline text styles
  },
  dangerText: {
    // Default danger text styles
  },
  // Utility styles
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  text: {
    fontFamily: 'DM Sans',
  },
});
