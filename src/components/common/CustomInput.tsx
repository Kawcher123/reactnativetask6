import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  required?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  placeholder,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  required = false,
  onValidationChange,
  value,
  onChangeText,
  onBlur,
  secureTextEntry,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleChangeText = (text: string) => {
    if (onChangeText) onChangeText(text);
    
    // Basic validation
    if (onValidationChange) {
      const isValid = text.trim().length > 0;
      onValidationChange(isValid);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle, { color: colors.text }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? '#ff4444' : isFocused ? colors.tint : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          },
          inputStyle,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        {...props}
      />
      
      {error && (
        <Text style={[styles.error, errorStyle, { color: '#ff4444' }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'DM Sans',
  },
  required: {
    color: '#ff4444',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'DM Sans',
  },
  error: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'DM Sans',
  },
});
