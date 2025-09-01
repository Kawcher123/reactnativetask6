import React, { memo, useCallback, useMemo } from 'react';
import {
    FlatList,
    FlatListProps,
    ListRenderItem,
    ViewToken,
    ViewabilityConfig,
} from 'react-native';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  getItemLayout?: (data: ArrayLike<T> | null | undefined, index: number) => { length: number; offset: number; index: number };
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  updateCellsBatchingPeriod?: number;
  disableVirtualization?: boolean;
}

const OptimizedFlatList = <T extends any>({
  data,
  renderItem,
  keyExtractor,
  onViewableItemsChanged,
  getItemLayout,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  windowSize = 21,
  removeClippedSubviews = true,
  updateCellsBatchingPeriod = 50,
  disableVirtualization = false,
  ...props
}: OptimizedFlatListProps<T>) => {
  const { trackRenderTime, trackMemoryUsage } = usePerformanceMonitoring();

  // Memoized viewability config for better performance
  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    (info) => {
      const startTime = performance.now();
      const result = renderItem(info);
      const endTime = performance.now();
      
      trackRenderTime('FlatList_RenderItem', endTime - startTime);
      return result;
    },
    [renderItem, trackRenderTime]
  );

  // Memoized key extractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  // Memoized viewable items changed callback
  const memoizedOnViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged]
  );

  // Track memory usage on mount and data changes
  React.useEffect(() => {
    trackMemoryUsage('FlatList_Memory');
  }, [data.length, trackMemoryUsage]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      onViewableItemsChanged={memoizedOnViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={getItemLayout}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      disableVirtualization={disableVirtualization}
      // Performance optimizations
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16} // 60fps
      decelerationRate="fast"
      {...props}
    />
  );
};

export default memo(OptimizedFlatList) as React.ComponentType<OptimizedFlatListProps<any>>;
