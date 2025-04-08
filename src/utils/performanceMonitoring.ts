/**
 * Performance monitoring utilities for the application
 */

import React, { useRef, useEffect } from 'react';

import { LoggerService } from '../services/LoggerService';

/**
 * Performance metrics categories
 */
export enum PerformanceCategory {
  RENDERING = 'rendering',
  DATA_LOADING = 'data_loading',
  USER_INTERACTION = 'user_interaction',
  NETWORK = 'network',
  STORAGE = 'storage',
}

/**
 * Interface for performance metrics
 */
export interface PerformanceMetric {
  name: string;
  category: PerformanceCategory;
  startTime: number;
  endTime?: number;
  duration?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring service
 */
class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled = true;
  private logger: LoggerService;

  constructor() {
    this.logger = LoggerService.getInstance();
  }

  /**
   * Enable or disable performance monitoring
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
    category: PerformanceCategory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';

    const id = `${name}_${Date.now()}`;
    const metric: PerformanceMetric = {
      name,
      category,
      startTime: performance.now(),
      metadata,
    };

    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * End measuring a performance metric
   * @param id The ID returned from startMeasure
   * @param additionalMetadata Additional metadata to add
   * @returns The duration of the metric in milliseconds
   */
  public endMeasure(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalMetadata?: Record<string, any>
  ): number {
    if (!this.isEnabled || !id) return 0;

    const metric = this.activeMetrics.get(id);
    if (!metric) {
      this.logger.warn(`No active metric found with id: ${id}`);
      return 0;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (additionalMetadata) {
      metric.metadata = {
        ...metric.metadata,
        ...additionalMetadata,
      };
    }

    this.metrics.push(metric);
    this.activeMetrics.delete(id);

    // Log the metric
    // Map performance category to log category
    const categoryMap: Record<PerformanceCategory, 'performance' | 'network' | 'storage'> = {
      [PerformanceCategory.RENDERING]: 'performance',
      [PerformanceCategory.DATA_LOADING]: 'storage',
      [PerformanceCategory.USER_INTERACTION]: 'performance',
      [PerformanceCategory.NETWORK]: 'network',
      [PerformanceCategory.STORAGE]: 'storage',
    };

    this.logger.info(`Performance metric: ${metric.name}`, {
      category: categoryMap[metric.category],
      duration: metric.duration,
      metadata: metric.metadata,
    });

    return metric.duration;
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
  }

  /**
   * Create a performance measurement decorator for class methods
   * @param category The performance category
   * @param metadataFn Optional function to extract metadata from method arguments
   */
  public createMethodDecorator(
    category: PerformanceCategory,
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
    if (name !== undefined && name !== '') {
      componentName = name;
    } else if (Component.displayName !== undefined && Component.displayName !== '') {
      componentName = Component.displayName;
    } else if (Component.name !== undefined && Component.name !== '') {
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
        const category = metric.category;
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
          const durationA = a.duration ?? 0;
          const durationB = b.duration ?? 0;
          return durationB - durationA;
        })
        .forEach(metric => {
          console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`, metric.metadata || '');
        });

      console.groupEnd();
    });

    console.groupEnd();
  }
}

// Create a singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

/**
 * React hook for measuring component render performance
 * @param componentName Name of the component
 * @param dependencies Dependencies array to control when to measure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRenderPerformance(componentName: string, dependencies: any[] = []): void {
  const metricId = useRef<string>('');

  useEffect(() => {
    metricId.current = performanceMonitoring.startMeasure(
      `${componentName}_render`,
      PerformanceCategory.RENDERING
    );

    return () => {
      performanceMonitoring.endMeasure(metricId.current);
    };
    // We need to include componentName in the dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentName, ...dependencies]);
}

/**
 * Decorator for measuring method performance
 * @param category Performance category
 */
export function measurePerformance(category: PerformanceCategory) {
  return performanceMonitoring.createMethodDecorator(category);
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
  return performanceMonitoring.wrapComponent<P>(Component, name);
}

export default performanceMonitoring;
