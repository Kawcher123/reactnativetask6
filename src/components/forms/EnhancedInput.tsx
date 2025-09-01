import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import hapticUtils from '../../utils/hapticUtils';

interface EnhancedInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  blurOnSubmit?: boolean;
  autoFocus?: boolean;
  clearButtonMode?: TextInputProps['clearButtonMode'];
  textContentType?: TextInputProps['textContentType'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  touched = false,
  required = false,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onLeftIconPress,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  onFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType = 'next',
  blurOnSubmit = true,
  autoFocus = false,
  clearButtonMode = 'while-editing',
  textContentType,
  accessibilityLabel,
  accessibilityHint,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const hasError = touched && error;
  const showCharCount = maxLength && maxLength > 0;
  const isPasswordField = secureTextEntry;

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  useEffect(() => {
    if (hasError) {
      triggerShakeAnimation();
    }
  }, [hasError]);

  const triggerShakeAnimation = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnimation]);

  const handleFocus = useCallback(async () => {
    setIsFocused(true);
    onFocus?.();
    
    await hapticUtils.formInteraction();
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [onFocus, animatedValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
    
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [onBlur, animatedValue]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    setCharCount(text.length);
  }, [onChangeText]);

  const handleRightIconPress = useCallback(async () => {
    if (isPasswordField) {
      setShowPassword(!showPassword);
      await hapticUtils.toggle();
    } else if (onRightIconPress) {
      onRightIconPress();
      await hapticUtils.buttonPress();
    }
  }, [isPasswordField, showPassword, onRightIconPress]);

  const handleLeftIconPress = useCallback(async () => {
    if (onLeftIconPress) {
      onLeftIconPress();
      await hapticUtils.buttonPress();
    }
  }, [onLeftIconPress]);

  const handleClear = useCallback(async () => {
    onChangeText('');
    setCharCount(0);
    await hapticUtils.buttonPress();
  }, [onChangeText]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const animatedBorderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E0E0E0', Colors.light.tint],
  });

  const animatedLabelColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666', Colors.light.tint],
  });

  const animatedLabelScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const animatedLabelTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <TouchableOpacity
        style={styles.leftIconContainer}
        onPress={handleLeftIconPress}
        disabled={!onLeftIconPress}
      >
        <Ionicons
          name={leftIcon}
          size={20}
          color={isFocused ? Colors.light.tint : '#666'}
        />
      </TouchableOpacity>
    );
  };

  const renderRightIcon = () => {
    if (isPasswordField) {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={handleRightIconPress}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={isFocused ? Colors.light.tint : '#666'}
          />
        </TouchableOpacity>
      );
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={handleRightIconPress}
        >
          <Ionicons
            name={rightIcon}
            size={20}
            color={isFocused ? Colors.light.tint : '#666'}
          />
        </TouchableOpacity>
      );
    }

    if (value && clearButtonMode === 'while-editing') {
      return (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={handleClear}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderCharCount = () => {
    if (!showCharCount) return null;

    return (
      <Text style={[
        styles.charCount,
        charCount > maxLength! * 0.8 && styles.charCountWarning,
        charCount > maxLength! && styles.charCountError,
      ]}>
        {charCount}/{maxLength}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: shakeAnimation }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={focusInput}
        activeOpacity={0.8}
        disabled={!editable}
      >
        {renderLeftIcon()}
        
        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              {
                color: animatedLabelColor,
                transform: [
                  { scale: animatedLabelScale },
                  { translateY: animatedLabelTranslateY },
                ],
              },
            ]}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              hasError && styles.inputError,
              isFocused && styles.inputFocused,
              !editable && styles.inputDisabled,
            ]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmitEditing}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            secureTextEntry={isPasswordField && !showPassword}
            keyboardType={keyboardType}
            maxLength={maxLength}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            autoFocus={autoFocus}
            clearButtonMode="never"
            textContentType={textContentType}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            {...restProps}
          />
        </View>
        
        {renderRightIcon()}
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        {hasError && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {helperText && !hasError && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
        
        {renderCharCount()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 56,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputFocused: {
    borderColor: Colors.light.tint,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  leftIconContainer: {
    marginRight: 12,
    padding: 4,
  },
  rightIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  bottomContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  charCountWarning: {
    color: '#FF9500',
  },
  charCountError: {
    color: '#FF3B30',
  },
});

export default EnhancedInput;
