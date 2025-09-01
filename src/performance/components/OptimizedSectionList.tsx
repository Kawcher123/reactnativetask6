import React, { memo, useCallback, useMemo } from 'react';
import {
    ListRenderItem,
    ListRenderItemInfo,
    SectionList,
    SectionListData,
    SectionListProps,
    ViewToken,
    ViewabilityConfig,
} from 'react-native';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface OptimizedSectionListProps<T, S> extends Omit<SectionListProps<T, S>, 'renderItem'> {
  sections: SectionListData<T, S>[];
  renderItem: ListRenderItem<T>;
  renderSectionHeader?: (info: { section: SectionListData<T, S> }) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  getItemLayout?: (data: SectionListData<T, S>[] | null, index: number) => { length: number; offset: number; index: number };
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  updateCellsBatchingPeriod?: number;
  disableVirtualization?: boolean;
}

const OptimizedSectionList = <T extends any, S extends any>({
  sections,
  renderItem,
  renderSectionHeader,
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
}: OptimizedSectionListProps<T, S>) => {
  const { trackRenderTime, trackMemoryUsage } = usePerformanceMonitoring();

  // Memoized viewability config for better performance
  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    (info: ListRenderItemInfo<T>) => {
      const startTime = performance.now();
      const result = renderItem(info);
      const endTime = performance.now();
      
      trackRenderTime('SectionList_RenderItem', endTime - startTime);
      return result;
    },
    [renderItem, trackRenderTime]
  );

  // Memoized section header renderer
  const memoizedRenderSectionHeader = useCallback(
    (info: { section: SectionListData<T, S> }) => {
      if (!renderSectionHeader) return null;
      
      const startTime = performance.now();
      const result = renderSectionHeader(info);
      const endTime = performance.now();
      
      trackRenderTime('SectionList_SectionHeader', endTime - startTime);
      return result;
    },
    [renderSectionHeader, trackRenderTime]
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
    const totalItems = sections.reduce((sum, section) => sum + section.data.length, 0);
    trackMemoryUsage('SectionList_Memory', totalItems);
  }, [sections, trackMemoryUsage]);

  return (
    <SectionList
      sections={sections}
      renderItem={memoizedRenderItem}
      renderSectionHeader={memoizedRenderSectionHeader}
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

export default memo(OptimizedSectionList) as React.ComponentType<OptimizedSectionListProps<any, any>>;
