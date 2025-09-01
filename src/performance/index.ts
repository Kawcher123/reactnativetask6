// Performance optimization exports
export { FadeInAnimation, default as GestureAnimations, LoadingAnimation } from './animations/GestureAnimations';
export { default as SwipeableNoteItem } from './animations/ListAnimations';
export { default as MemoizedFilterChip } from './components/MemoizedComponents/MemoizedFilterChip';
export { default as MemoizedNoteItem } from './components/MemoizedComponents/MemoizedNoteItem';
export { default as OptimizedFlatList } from './components/OptimizedFlatList';
export { default as OptimizedSectionList } from './components/OptimizedSectionList';
export { default as PerformanceMonitor } from './monitoring/PerformanceMonitor';

// Performance hooks
export { useDebounced, useDebouncedSearch } from './hooks/useDebounced';
export { useMemoizedCalculations } from './hooks/useMemoizedCalculations';
export { useOptimizedCallbacks } from './hooks/useOptimizedCallbacks';
export { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

// Lazy components
// export {
//     ConditionalCameraComponent, LazyCameraComponent, LazyComponentErrorBoundary, LazyPhotoGalleryComponent, LazySocialFeedComponent
// } from './components/LazyComponents/LazyComponents';

// Performance utilities
export { bundleOptimization, bundlePerformance, startupOptimization } from '../utils/bundleOptimization';
export { performanceTests } from '../utils/performanceTests';
export { performanceUtils } from '../utils/performanceUtils';

