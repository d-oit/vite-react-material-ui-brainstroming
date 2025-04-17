/**
 * Performance Tracker Utility
 *
 * This utility provides tools for tracking and monitoring performance metrics
 * in the application. It includes functions for measuring component render times,
 * tracking network requests, and monitoring user interactions.
 */

import React, { useEffect, useRef } from 'react';

import { LoggerService } from '../services/LoggerService';

// Define performance metric categories
export enum MetricCategory {
  RENDER = 'render',
  NETWORK = 'network',
  INTERACTION = 'interaction',
  RESOURCE = 'resource',
  CUSTOM = 'custom',
}

// For compatibility with existing code
export enum PerformanceCategory {
  RENDERING = 'rendering',
  DATA_LOADING = 'data_loading',
  USER_INTERACTION = 'user_interaction',
  NETWORK = 'network',
  STORAGE = 'storage',
}

// Define performance metric interface
export interface PerformanceMetric {
  id: string;
  name: string;
  category: MetricCategory | PerformanceCategory;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Define performance budget thresholds
export const PerformanceBudget = {
  RENDER: {
    GOOD: 16, // 60fps (16.67ms)
    ACCEPTABLE: 33, // 30fps (33.33ms)
    POOR: 50, // 20fps (50ms)
  },
  NETWORK: {
    GOOD: 300, // 300ms
    ACCEPTABLE: 1000, // 1s
    POOR: 3000, // 3s
  },
  INTERACTION: {
    GOOD: 100, // 100ms
    ACCEPTABLE: 300, // 300ms
    POOR: 500, // 500ms
  },
};

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = true;
  private listeners: Set<(metrics: PerformanceMetric[]) => void> = new Set();
  private logger: LoggerService;

  constructor() {
    // Check if LoggerService is available and has getInstance method
    try {
      if (
        typeof LoggerService === 'object' &&
        LoggerService !== null &&
        'getInstance' in LoggerService
      ) {
        this.logger = LoggerService.getInstance();
      } else if (typeof LoggerService === 'function' && 'getInstance' in LoggerService) {
        this.logger = LoggerService.getInstance();
      } else {
        // Fallback logger
        this.logger = {
          info: console.info.bind(console),
          error: console.error.bind(console),
          warn: console.warn.bind(console),
          debug: console.debug.bind(console),
          log: console.log.bind(console),
        };
      }
    } catch (error) {
      console.error('Error initializing logger in PerformanceTracker:', error);
      // Fallback logger
      this.logger = {
        info: console.info.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
        debug: console.debug.bind(console),
        log: console.log.bind(console),
      };
    }
  }

  /**
   * Enable or disable performance tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Start measuring a performance metric
   * @param name Name of the metric
   * @param category Category of the metric
   * @param metadata Additional metadata
   * @returns A unique ID for the metric
   */
  public startMeasure(
    name: string,
    category: MetricCategory | PerformanceCategory,
    metadata?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';

    // Generate a unique ID that doesn't include the timestamp twice
    const uniqueId = `${name}_${Math.random().toString(36).substring(2, 9)}`;

    const metric: PerformanceMetric = {
      id: uniqueId,
      name,
      category,
      startTime:
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : typeof Date.now === 'function'
            ? Date.now()
            : new Date().getTime(),
      metadata,
    };

    this.activeMetrics.set(uniqueId, metric);
    return uniqueId;
  }

  /**
   * End measuring a performance metric
   * @param id The ID returned from startMeasure
   * @param additionalMetadata Additional metadata to add
   * @returns The duration of the metric in milliseconds
   */
  public endMeasure(id: string, additionalMetadata?: Record<string, any>): number {
    if (!this.isEnabled || !id) return 0;

    const metric = this.activeMetrics.get(id);
    if (!metric) {
      console.warn(`No active metric found with id: ${id}`);
      return 0;
    }

    // Use a safer way to get current timestamp
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : typeof Date.now === 'function'
          ? Date.now()
          : new Date().getTime();

    metric.endTime = now;
    metric.duration = metric.endTime - metric.startTime;

    if (additionalMetadata) {
      metric.metadata = {
        ...metric.metadata,
        ...additionalMetadata,
      };
    }

    this.metrics.push(metric);
    this.activeMetrics.delete(id);

    // Notify listeners
    this.notifyListeners();

    // Log performance issues
    this.logPerformanceIssue(metric);

    // Log the metric
    try {
      // Map performance category to log category
      const categoryMap: Record<string, 'performance' | 'network' | 'storage'> = {
        [MetricCategory.RENDER]: 'performance',
        [MetricCategory.NETWORK]: 'network',
        [MetricCategory.INTERACTION]: 'performance',
        [MetricCategory.RESOURCE]: 'performance',
        [MetricCategory.CUSTOM]: 'performance',
        [PerformanceCategory.RENDERING]: 'performance',
        [PerformanceCategory.DATA_LOADING]: 'storage',
        [PerformanceCategory.USER_INTERACTION]: 'performance',
        [PerformanceCategory.NETWORK]: 'network',
        [PerformanceCategory.STORAGE]: 'storage',
      };

      const logCategory = categoryMap[metric.category] || 'performance';

      void this.logger.info(`Performance metric: ${metric.name}`, {
        category: logCategory,
        duration: metric.duration,
        metadata: metric.metadata,
      });
    } catch (error) {
      // Fallback to console if logger fails
      console.info(`Performance metric: ${metric.name}`, {
        duration: metric.duration,
        metadata: metric.metadata,
      });
    }

    return metric.duration;
  }

  /**
   * Log performance issues based on budget thresholds
   */
  private logPerformanceIssue(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    let threshold = 0;
    let level: 'GOOD' | 'ACCEPTABLE' | 'POOR' = 'GOOD';

    // Map the category to the appropriate budget
    const category = String(metric.category);
    const metricName = String(metric.name || '');

    // Special case for App initialization which is allowed to take longer
    if (metricName.includes('App.initialization')) {
      // App initialization can take longer, so we use a higher threshold
      threshold = 500; // 500ms threshold for initialization
      if (metric.duration > 1000) {
        // 1 second is poor
        level = 'POOR';
      } else if (metric.duration > 500) {
        // 500ms is acceptable
        level = 'ACCEPTABLE';
      }
    } else if (category === MetricCategory.RENDER || category === PerformanceCategory.RENDERING) {
      threshold = PerformanceBudget.RENDER.ACCEPTABLE;
      if (metric.duration > PerformanceBudget.RENDER.POOR) {
        level = 'POOR';
      } else if (metric.duration > PerformanceBudget.RENDER.ACCEPTABLE) {
        level = 'ACCEPTABLE';
      }
    } else if (category === MetricCategory.NETWORK || category === PerformanceCategory.NETWORK) {
      threshold = PerformanceBudget.NETWORK.ACCEPTABLE;
      if (metric.duration > PerformanceBudget.NETWORK.POOR) {
        level = 'POOR';
      } else if (metric.duration > PerformanceBudget.NETWORK.ACCEPTABLE) {
        level = 'ACCEPTABLE';
      }
    } else if (
      category === MetricCategory.INTERACTION ||
      category === PerformanceCategory.USER_INTERACTION
    ) {
      threshold = PerformanceBudget.INTERACTION.ACCEPTABLE;
      if (metric.duration > PerformanceBudget.INTERACTION.POOR) {
        level = 'POOR';
      } else if (metric.duration > PerformanceBudget.INTERACTION.ACCEPTABLE) {
        level = 'ACCEPTABLE';
      }
    }

    if (level === 'POOR') {
      console.warn(
        `Performance issue detected: ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        metric
      );
    }
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all recorded metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.notifyListeners();
  }

  /**
   * Add a listener for metric updates
   */
  public addListener(listener: (metrics: PerformanceMetric[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of metric updates
   */
  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach(listener => {
      listener(metrics);
    });
  }

  /**
   * Measure a function execution time
   * @param fn Function to measure
   * @param name Name of the metric
   * @param category Category of the metric
   * @param metadata Additional metadata
   * @returns The result of the function
   */
  public measureFunction<T>(
    fn: () => T,
    name: string,
    category: MetricCategory | PerformanceCategory,
    metadata?: Record<string, any>
  ): T {
    const id = this.startMeasure(name, category, metadata);
    try {
      return fn();
    } finally {
      this.endMeasure(id);
    }
  }

  /**
   * Measure an async function execution time
   * @param fn Async function to measure
   * @param name Name of the metric
   * @param category Category of the metric
   * @param metadata Additional metadata
   * @returns A promise that resolves to the result of the function
   */
  public async measureAsyncFunction<T>(
    fn: () => Promise<T>,
    name: string,
    category: MetricCategory | PerformanceCategory,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startMeasure(name, category, metadata);
    try {
      return await fn();
    } finally {
      this.endMeasure(id);
    }
  }

  /**
   * Create a performance measurement decorator for class methods
   * @param category The performance category
   * @param metadataFn Optional function to extract metadata from method arguments
   */
  public createMethodDecorator(
    category: MetricCategory | PerformanceCategory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadataFn?: (...args: any[]) => Record<string, any>
  ) {
    // Capture 'this' context for use in the decorator
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const perfMonitor = this;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      descriptor.value = function (...args: any[]) {
        const metricName = `${target.constructor.name}.${propertyKey}`;
        const metadata = metadataFn ? metadataFn(...args) : undefined;

        // Use the stored reference to the performance monitoring instance
        const metricId = perfMonitor.startMeasure(metricName, category, metadata);

        try {
          const result = originalMethod.apply(this, args);

          // Handle promises
          if (result instanceof Promise) {
            return result.finally(() => {
              perfMonitor.endMeasure(metricId);
            });
          }

          perfMonitor.endMeasure(metricId);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          perfMonitor.endMeasure(metricId, { error: errorMessage });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * Create a React component performance wrapper
   * @param Component The React component to wrap
   * @param name Optional name for the metric (defaults to component display name)
   */
  public wrapComponent<P extends { [key: string]: unknown }>(
    Component: React.ComponentType<P>,
    name?: string
  ): React.FC<P> {
    let componentName = 'UnknownComponent';
    if (typeof name === 'string' && name.length > 0) {
      componentName = name;
    } else if (typeof Component.displayName === 'string' && Component.displayName.length > 0) {
      componentName = Component.displayName;
    } else if (typeof Component.name === 'string' && Component.name.length > 0) {
      componentName = Component.name;
    }
    // Capture 'this' context for use in the wrapper
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const perfMonitor = this;

    const WrappedComponent: React.FC<P> = props => {
      const metricId = useRef<string>('');

      useEffect(() => {
        // Start measuring component render time
        metricId.current = perfMonitor.startMeasure(
          `${componentName}_render`,
          PerformanceCategory.RENDERING,
          { propKeys: Object.keys(props as object) }
        );

        return () => {
          perfMonitor.endMeasure(metricId.current);
        };
        // We need to include props to properly track component re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [props]);

      return React.createElement<P>(Component, props);
    };

    WrappedComponent.displayName = `PerformanceMonitored(${componentName})`;

    return WrappedComponent;
  }

  /**
   * Report metrics to the console
   */
  public reportToConsole(): void {
    console.group('Performance Metrics Report');

    // Group by category
    const categorized = this.metrics.reduce(
      (acc, metric) => {
        const category = String(metric.category);
        if (acc[category] === undefined) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      },
      {} as Record<string, PerformanceMetric[]>
    );

    // Log each category
    Object.entries(categorized).forEach(([category, metrics]) => {
      console.group(`Category: ${category}`);

      // Sort by duration (descending)
      metrics
        .sort((a, b) => {
          const durationA = typeof a.duration === 'number' ? a.duration : 0;
          const durationB = typeof b.duration === 'number' ? b.duration : 0;
          return durationB - durationA;
        })
        .forEach(metric => {
          const duration =
            typeof metric.duration === 'number' ? metric.duration.toFixed(2) : '0.00';
          console.log(`${metric.name}: ${duration}ms`, metric.metadata ?? {});
        });

      console.groupEnd();
    });

    console.groupEnd();
  }
}

// Create a singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * React hook for measuring component render performance
 * @param componentName Name of the component
 */
export function useRenderPerformance(componentName: string): void {
  const metricId = useRef<string>('');

  useEffect(() => {
    metricId.current = performanceTracker.startMeasure(
      `${componentName}_render`,
      MetricCategory.RENDER
    );

    return () => {
      performanceTracker.endMeasure(metricId.current);
    };
  });
}

/**
 * React hook for measuring component mount and update performance
 * @param componentName Name of the component
 * @param dependencies Dependencies array to control when to measure
 */
export function useMountPerformance(componentName: string, dependencies: any[] = []): void {
  useEffect(() => {
    const id = performanceTracker.startMeasure(`${componentName}_mount`, MetricCategory.RENDER);

    return () => {
      performanceTracker.endMeasure(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, ...dependencies]);
}

/**
 * Higher-order component for measuring component performance
 * @param Component The component to wrap
 * @param name Optional name for the metric
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
): React.FC<P> {
  const displayName = name || Component.displayName || Component.name || 'Component';

  const WrappedComponent: React.FC<P> = props => {
    useRenderPerformance(displayName);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `WithPerformanceTracking(${displayName})`;

  return WrappedComponent;
}

/**
 * Decorator for measuring method performance
 * @param category Performance category
 */
export function measurePerformance(category: MetricCategory | PerformanceCategory) {
  return performanceTracker.createMethodDecorator(category);
}

/**
 * Higher-order component for measuring component performance
 * @param Component The component to wrap
 * @param name Optional name for the metric
 */
export function withPerformanceMonitoring<P extends { [key: string]: unknown }>(
  Component: React.ComponentType<P>,
  name?: string
): React.FC<P> {
  return performanceTracker.wrapComponent<P>(Component, name);
}

// Export the singleton instance as both names for compatibility
export const performanceMonitoring = performanceTracker;

export default performanceTracker;
