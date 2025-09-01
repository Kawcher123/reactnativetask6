import { useCallback, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

interface PerformanceData {
  [key: string]: PerformanceMetrics[];
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceData = {};
  private memoryThreshold = 200 * 1024 * 1024; // 200MB
  private renderTimeThreshold = 16; // 16ms for 60fps

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  trackRenderTime(componentName: string, renderTime: number): void {
    if (!this.metrics[componentName]) {
      this.metrics[componentName] = [];
    }

    this.metrics[componentName].push({
      renderTime,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    });

    // Keep only last 100 measurements
    if (this.metrics[componentName].length > 100) {
      this.metrics[componentName] = this.metrics[componentName].slice(-100);
    }

    // Log performance warnings
    if (renderTime > this.renderTimeThreshold) {
      console.warn(`Performance warning: ${componentName} took ${renderTime.toFixed(2)}ms to render`);
    }
  }

  trackMemoryUsage(componentName: string, itemCount?: number): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (!this.metrics[componentName]) {
      this.metrics[componentName] = [];
    }

    this.metrics[componentName].push({
      renderTime: 0,
      memoryUsage,
      timestamp: Date.now(),
    });

    // Keep only last 50 memory measurements
    if (this.metrics[componentName].length > 50) {
      this.metrics[componentName] = this.metrics[componentName].slice(-50);
    }

    // Log memory warnings
    if (memoryUsage > this.memoryThreshold) {
      console.warn(`Memory warning: ${componentName} using ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    if (itemCount && itemCount > 1000) {
      console.warn(`Large dataset warning: ${componentName} rendering ${itemCount} items`);
    }
  }

  getPerformanceReport(componentName?: string): PerformanceData | PerformanceMetrics[] {
    if (componentName) {
      return this.metrics[componentName] || [];
    }
    return this.metrics;
  }

  getAverageRenderTime(componentName: string): number {
    const metrics = this.metrics[componentName];
    if (!metrics || metrics.length === 0) return 0;

    const renderTimes = metrics.map(m => m.renderTime).filter(t => t > 0);
    if (renderTimes.length === 0) return 0;

    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  }

  getPeakMemoryUsage(componentName: string): number {
    const metrics = this.metrics[componentName];
    if (!metrics || metrics.length === 0) return 0;

    return Math.max(...metrics.map(m => m.memoryUsage));
  }

  private getMemoryUsage(): number {
    // In a real app, you might use React Native's Performance API
    // or a third-party library to get actual memory usage
    // For now, we'll return a mock value
    return Math.random() * 100 * 1024 * 1024; // Random value between 0-100MB
  }

  clearMetrics(componentName?: string): void {
    if (componentName) {
      delete this.metrics[componentName];
    } else {
      this.metrics = {};
    }
  }
}

export const usePerformanceMonitoring = () => {
  const trackerRef = useRef(PerformanceTracker.getInstance());

  const trackRenderTime = useCallback((componentName: string, renderTime: number) => {
    trackerRef.current.trackRenderTime(componentName, renderTime);
  }, []);

  const trackMemoryUsage = useCallback((componentName: string, itemCount?: number) => {
    trackerRef.current.trackMemoryUsage(componentName, itemCount);
  }, []);

  const getPerformanceReport = useCallback((componentName?: string) => {
    return trackerRef.current.getPerformanceReport(componentName);
  }, []);

  const getAverageRenderTime = useCallback((componentName: string) => {
    return trackerRef.current.getAverageRenderTime(componentName);
  }, []);

  const getPeakMemoryUsage = useCallback((componentName: string) => {
    return trackerRef.current.getPeakMemoryUsage(componentName);
  }, []);

  const clearMetrics = useCallback((componentName?: string) => {
    trackerRef.current.clearMetrics(componentName);
  }, []);

  return {
    trackRenderTime,
    trackMemoryUsage,
    getPerformanceReport,
    getAverageRenderTime,
    getPeakMemoryUsage,
    clearMetrics,
  };
};
