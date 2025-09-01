import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

const { width: screenWidth } = Dimensions.get('window');

interface GestureAnimationsProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  style?: any;
}

const GestureAnimations: React.FC<GestureAnimationsProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const panGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Initialize gesture
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Add rotation based on horizontal movement
      rotation.value = interpolate(
        event.translationX,
        [-screenWidth / 2, screenWidth / 2],
        [-15, 15],
        Extrapolate.CLAMP
      );
      
      // Scale down slightly during drag
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, 100],
        [1, 0.95],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      const swipeThreshold = screenWidth * 0.3;
      
      if (event.translationX > swipeThreshold && onSwipeRight) {
        // Swipe right
        translateX.value = withSpring(screenWidth, { damping: 15 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -swipeThreshold && onSwipeLeft) {
        // Swipe left
        translateX.value = withSpring(-screenWidth, { damping: 15 });
        runOnJS(onSwipeLeft)();
      } else {
        // Reset position
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        scale.value = withSpring(1, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const handleTap = useCallback(() => {
    if (onTap) {
      // Add a subtle scale animation on tap
      scale.value = withSpring(0.95, { damping: 15 }, () => {
        scale.value = withSpring(1, { damping: 15 });
      });
      onTap();
    }
  }, [onTap, scale]);

  return (
    <PanGestureHandler onGestureEvent={panGestureHandler}>
      <Animated.View style={[styles.container, animatedStyle, style]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

// Loading animation component
export const LoadingAnimation: React.FC<{ size?: number }> = ({ size = 40 }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(360, { duration: 1000 }, () => {
      rotation.value = 0;
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.loadingContainer, { width: size, height: size }, animatedStyle]}>
      <Ionicons name="refresh" size={size * 0.6} color="#007AFF" />
    </Animated.View>
  );
};

// Fade in animation component
export const FadeInAnimation: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GestureAnimations;
