import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

// Lazy load heavy components
// const CameraScreen = lazy(() => import('../../../screens/camera/CameraScreen'));
// const SocialFeedScreen = lazy(() => import('../../../screens/social/SocialFeedScreen'));
// const PhotoGalleryScreen = lazy(() => import('../../../screens/media/PhotoGalleryScreen'));

// Loading component for lazy-loaded screens
const LazyLoadingFallback: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  );
};

// Lazy Camera Component
// export const LazyCameraComponent: React.FC<any> = (props) => {
//   return (
//     <Suspense fallback={<LazyLoadingFallback />}>
//       <CameraScreen {...props} />
//     </Suspense>
//   );
// };

// Lazy Social Feed Component
// export const LazySocialFeedComponent: React.FC<any> = (props) => {
//   return (
//     <Suspense fallback={<LazyLoadingFallback />}>
//       <SocialFeedScreen {...props} />
//     </Suspense>
//   );
// };

// Lazy Photo Gallery Component
// export const LazyPhotoGalleryComponent: React.FC<any> = (props) => {
//   return (
//     <Suspense fallback={<LazyLoadingFallback />}>
//       <PhotoGalleryScreen {...props} />
//     </Suspense>
//   );
// };

// Conditional loading based on permissions
// export const ConditionalCameraComponent: React.FC<{ hasPermission: boolean }> = ({ 
//   hasPermission 
// }) => {
//   if (!hasPermission) {
//     return null;
//   }

//   return <LazyCameraComponent />;
// };

// Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#ff4444" />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
