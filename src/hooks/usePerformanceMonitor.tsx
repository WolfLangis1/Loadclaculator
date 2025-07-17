import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PerformanceMetrics, PerformanceMonitorOptions } from '../types/performance';

export const usePerformanceMonitor = (
  componentName: string,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    trackRenders = true,
    trackMemory = true,
    trackUpdates = true,
    sampleInterval = 1000,
    alertThreshold = 16 // 16ms for 60fps
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentUpdates: 0,
    lastUpdate: new Date(),
    averageRenderTime: 0,
    peakMemoryUsage: 0
  });

  const renderStartTime = useRef<number>(0);
  const updateCount = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Track render start
  const startRender = useCallback(() => {
    if (trackRenders) {
      renderStartTime.current = performance.now();
    }
  }, [trackRenders]);

  // Track render end
  const endRender = useCallback(() => {
    if (trackRenders && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      renderTimes.current.push(renderTime);
      
      // Keep only last 100 render times for average calculation
      if (renderTimes.current.length > 100) {
        renderTimes.current = renderTimes.current.slice(-100);
      }
      
      const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      // Alert if render time exceeds threshold
      if (renderTime > alertThreshold) {
        console.warn(`⚠️ ${componentName}: Slow render detected (${renderTime.toFixed(2)}ms)`);
      }

      setMetrics(prev => ({
        ...prev,
        renderTime,
        averageRenderTime,
        lastUpdate: new Date()
      }));
      
      renderStartTime.current = 0;
    }
  }, [trackRenders, alertThreshold, componentName]);

  // Track component updates
  const trackUpdate = useCallback(() => {
    if (trackUpdates) {
      updateCount.current += 1;
      setMetrics(prev => ({
        ...prev,
        componentUpdates: updateCount.current
      }));
    }
  }, [trackUpdates]);

  // Memory monitoring
  useEffect(() => {
    if (trackMemory && 'memory' in performance) {
      intervalRef.current = setInterval(() => {
        const memoryInfo = (performance as any).memory;
        const currentMemory = memoryInfo.usedJSHeapSize;
        
        setMetrics(prev => {
          // Only update if memory usage changed significantly to prevent constant re-renders
          const memoryDiff = Math.abs(currentMemory - prev.memoryUsage);
          if (memoryDiff > 1024 * 1024) { // Only update if change > 1MB
            return {
              ...prev,
              memoryUsage: currentMemory,
              peakMemoryUsage: Math.max(prev.peakMemoryUsage, currentMemory)
            };
          }
          return prev;
        });
      }, sampleInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [trackMemory, sampleInterval]);

  // Log performance data
  const logPerformance = useCallback(() => {
    console.log(`📊 Performance metrics for ${componentName}:`, {
      ...metrics,
      memoryUsageMB: (metrics.memoryUsage / 1024 / 1024).toFixed(2) + 'MB',
      peakMemoryUsageMB: (metrics.peakMemoryUsage / 1024 / 1024).toFixed(2) + 'MB'
    });
  }, [componentName, metrics]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    updateCount.current = 0;
    renderTimes.current = [];
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      componentUpdates: 0,
      lastUpdate: new Date(),
      averageRenderTime: 0,
      peakMemoryUsage: 0
    });
  }, []);

  return {
    metrics,
    startRender,
    endRender,
    trackUpdate,
    logPerformance,
    resetMetrics
  };
};

// HOC for automatic performance monitoring
export const withPerformanceMonitor = <P extends object,>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const { startRender, endRender, trackUpdate } = usePerformanceMonitor(
      componentName || Component.displayName || Component.name || 'Unknown'
    );

    useEffect(() => {
      startRender();
      trackUpdate();
      
      return () => {
        endRender();
      };
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitor(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for monitoring specific operations
export const useOperationTiming = () => {
  const [timings, setTimings] = useState<{ [key: string]: number }>({});

  const timeOperation = useCallback(async <T,>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setTimings(prev => ({
        ...prev,
        [operationName]: duration
      }));
      
      console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { timings, timeOperation };
};

// React DevTools Profiler integration
export const useProfiler = (id: string, onRender?: (id: string, phase: string, actualDuration: number) => void) => {
  const handleRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`🔍 Profiler ${id}:`, {
      phase,
      actualDuration: actualDuration.toFixed(2) + 'ms',
      baseDuration: baseDuration.toFixed(2) + 'ms',
      startTime: startTime.toFixed(2) + 'ms',
      commitTime: commitTime.toFixed(2) + 'ms'
    });

    if (onRender) {
      onRender(id, phase, actualDuration);
    }
  }, [onRender]);

  return handleRender;
};