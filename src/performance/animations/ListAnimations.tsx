import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface SwipeableNoteItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  style?: any;
}

const SwipeableNoteItem: React.FC<SwipeableNoteItemProps> = ({
  children,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const translateX = useSharedValue(0);
  const deleteButtonOpacity = useSharedValue(0);
  const favoriteButtonOpacity = useSharedValue(0);

  const panGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Reset animations when starting new gesture
    },
    onActive: (event) => {
      // Only respond to horizontal swipes
      if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
        translateX.value = event.translationX;
        
        // Show/hide action buttons based on swipe distance
        if (event.translationX < -50) {
          deleteButtonOpacity.value = withTiming(1, { duration: 200 });
          favoriteButtonOpacity.value = withTiming(1, { duration: 200 });
        } else {
          deleteButtonOpacity.value = withTiming(0, { duration: 200 });
          favoriteButtonOpacity.value = withTiming(0, { duration: 200 });
        }
      }
    },
    onEnd: (event) => {
      // Only handle horizontal swipes
      if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
        if (event.translationX < -100) {
          // Swipe threshold reached, trigger delete
          translateX.value = withSpring(-200, { damping: 15 });
          runOnJS(onDelete)();
        } else {
          // Reset position
          translateX.value = withSpring(0, { damping: 15 });
          deleteButtonOpacity.value = withTiming(0, { duration: 200 });
          favoriteButtonOpacity.value = withTiming(0, { duration: 200 });
        }
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const deleteButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: deleteButtonOpacity.value,
      transform: [
        {
          scale: interpolate(
            deleteButtonOpacity.value,
            [0, 1],
            [0.8, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const favoriteButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: favoriteButtonOpacity.value,
      transform: [
        {
          scale: interpolate(
            favoriteButtonOpacity.value,
            [0, 1],
            [0.8, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.();
  }, [onToggleFavorite]);

  return (
    <View style={[styles.container, style]}>
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Animated.View style={[styles.actionButton, styles.favoriteButton, favoriteButtonStyle]}>
          <Ionicons
            name={isFavorite ? "star" : "star-outline"}
            size={24}
            color={isFavorite ? "#FFD700" : colors.text}
          />
        </Animated.View>
        <Animated.View style={[styles.actionButton, styles.deleteButton, deleteButtonStyle]}>
          <Ionicons name="trash" size={24} color="#fff" />
        </Animated.View>
      </View>

      {/* Main content */}
      <PanGestureHandler 
        onGestureEvent={panGestureHandler}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionButtons: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  favoriteButton: {
    backgroundColor: '#FFD700',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default SwipeableNoteItem;
