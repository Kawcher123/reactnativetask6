// Performance utilities for monitoring and optimization

export const performanceUtils = {
  // Performance monitoring
  performanceMetrics: {
    renderTimes: new Map<string, number[]>(),
    memoryUsage: new Map<string, number[]>(),
    frameRates: new Map<string, number[]>(),
  },

  // Track render performance
  trackRenderTime(componentName: string, renderTime: number) {
    if (!this.performanceMetrics.renderTimes.has(componentName)) {
      this.performanceMetrics.renderTimes.set(componentName, []);
    }

    const times = this.performanceMetrics.renderTimes.get(componentName)!;
    times.push(renderTime);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }

    // Log warnings for slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  },

  // Track memory usage
  trackMemoryUsage(componentName: string, usage: number) {
    if (!this.performanceMetrics.memoryUsage.has(componentName)) {
      this.performanceMetrics.memoryUsage.set(componentName, []);
    }

    const usageArray = this.performanceMetrics.memoryUsage.get(componentName)!;
    usageArray.push(usage);

    // Keep only last 50 measurements
    if (usageArray.length > 50) {
      usageArray.splice(0, usageArray.length - 50);
    }

    // Log warnings for high memory usage
    if (usage > 200 * 1024 * 1024) { // 200MB threshold
      console.warn(`High memory usage detected in ${componentName}: ${(usage / 1024 / 1024).toFixed(2)}MB`);
    }
  },

  // Get performance report
  getPerformanceReport(componentName?: string) {
    if (componentName) {
      return {
        renderTimes: this.performanceMetrics.renderTimes.get(componentName) || [],
        memoryUsage: this.performanceMetrics.memoryUsage.get(componentName) || [],
        frameRates: this.performanceMetrics.frameRates.get(componentName) || [],
      };
    }

    return this.performanceMetrics;
  },

  // Calculate average render time
  getAverageRenderTime(componentName: string): number {
    const times = this.performanceMetrics.renderTimes.get(componentName);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  },

  // Calculate peak memory usage
  getPeakMemoryUsage(componentName: string): number {
    const usage = this.performanceMetrics.memoryUsage.get(componentName);
    if (!usage || usage.length === 0) return 0;

    return Math.max(...usage);
  },
};

// List optimization utilities
export const listOptimization = {
  // Optimize FlatList performance
  getOptimizedFlatListProps(itemHeight: number = 120) {
    return {
      initialNumToRender: 10,
      maxToRenderPerBatch: 10,
      windowSize: 21,
      removeClippedSubviews: true,
      updateCellsBatchingPeriod: 50,
      getItemLayout: (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
      scrollEventThrottle: 16, // 60fps
      decelerationRate: 'fast' as const,
    };
  },

  // Optimize SectionList performance
  getOptimizedSectionListProps(itemHeight: number = 120) {
    return {
      initialNumToRender: 10,
      maxToRenderPerBatch: 10,
      windowSize: 21,
      removeClippedSubviews: true,
      updateCellsBatchingPeriod: 50,
      getItemLayout: (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
      scrollEventThrottle: 16,
      decelerationRate: 'fast' as const,
    };
  },

  // Virtual scrolling utilities
  virtualScrolling: {
    // Calculate visible items
    getVisibleItems(
      scrollOffset: number,
      containerHeight: number,
      itemHeight: number,
      totalItems: number
    ) {
      const startIndex = Math.floor(scrollOffset / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        totalItems - 1
      );

      return {
        startIndex: Math.max(0, startIndex),
        endIndex: Math.max(0, endIndex),
        visibleCount: endIndex - startIndex + 1,
      };
    },

    // Optimize item rendering
    shouldRenderItem(
      index: number,
      visibleRange: { startIndex: number; endIndex: number },
      buffer: number = 5
    ): boolean {
      return index >= visibleRange.startIndex - buffer && 
             index <= visibleRange.endIndex + buffer;
    },
  },
};

// Animation optimization utilities
export const animationOptimization = {
  // Optimize Reanimated animations
  getOptimizedAnimationConfig() {
    return {
      damping: 15,
      stiffness: 150,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    };
  },

  // Optimize gesture animations
  getOptimizedGestureConfig() {
    return {
      velocityThreshold: 500,
      distanceThreshold: 50,
      maxPointers: 1,
      shouldCancelWhenOutside: true,
    };
  },

  // Frame rate monitoring
  frameRateMonitor: {
    frameCount: 0,
    lastFrameTime: 0,
    frameRates: [] as number[],

    startMonitoring() {
      this.frameCount = 0;
      this.lastFrameTime = performance.now();
      this.frameRates = [];
    },

    recordFrame() {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastFrameTime >= 1000) { // Every second
        const fps = this.frameCount;
        this.frameRates.push(fps);
        
        if (fps < 50) { // Warn if below 50fps
          console.warn(`Low frame rate detected: ${fps}fps`);
        }
        
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }
    },

    getAverageFrameRate(): number {
      if (this.frameRates.length === 0) return 0;
      return this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length;
    },
  },
};

// Memory optimization utilities
export const memoryOptimization = {
  // Memory leak detection
  memoryLeakDetector: {
    componentRefs: new WeakMap<object, string>(),
    mountTimes: new Map<string, number>(),

    trackComponent(component: object, componentName: string) {
      this.componentRefs.set(component, componentName);
      this.mountTimes.set(componentName, Date.now());
    },

    untrackComponent(component: object) {
      const componentName = this.componentRefs.get(component);
      if (componentName) {
        this.mountTimes.delete(componentName);
        this.componentRefs.delete(component);
      }
    },

    checkForLeaks() {
      const now = Date.now();
      const maxLifetime = 5 * 60 * 1000; // 5 minutes

      this.mountTimes.forEach((mountTime, componentName) => {
        if (now - mountTime > maxLifetime) {
          console.warn(`Potential memory leak detected: ${componentName} mounted for ${((now - mountTime) / 1000).toFixed(0)}s`);
        }
      });
    },
  },

  // Image optimization
  imageOptimization: {
    // Optimize image loading
    getOptimizedImageProps(width: number, height: number) {
      return {
        width,
        height,
        resizeMode: 'cover' as const,
        progressiveRenderingEnabled: true,
        cachePolicy: 'memory-disk' as const,
      };
    },

    // Lazy load images
    shouldLoadImage(visible: boolean, priority: 'high' | 'medium' | 'low' = 'medium'): boolean {
      if (priority === 'high') return true;
      return visible;
    },
  },

  // Cache optimization
  cacheOptimization: {
    // LRU cache implementation
    createLRUCache<T>(maxSize: number = 100) {
      const cache = new Map<string, T>();
      const accessOrder: string[] = [];

      return {
        get(key: string): T | undefined {
          if (cache.has(key)) {
            // Move to end (most recently used)
            const index = accessOrder.indexOf(key);
            if (index > -1) {
              accessOrder.splice(index, 1);
            }
            accessOrder.push(key);
            return cache.get(key);
          }
          return undefined;
        },

        set(key: string, value: T) {
          if (cache.has(key)) {
            // Update existing
            cache.set(key, value);
            // Move to end
            const index = accessOrder.indexOf(key);
            if (index > -1) {
              accessOrder.splice(index, 1);
            }
            accessOrder.push(key);
          } else {
            // Add new
            cache.set(key, value);
            accessOrder.push(key);

            // Remove least recently used if over limit
            if (cache.size > maxSize) {
              const lruKey = accessOrder.shift();
              if (lruKey) {
                cache.delete(lruKey);
              }
            }
          }
        },

        clear() {
          cache.clear();
          accessOrder.length = 0;
        },

        size: () => cache.size,
      };
    },
  },
};
