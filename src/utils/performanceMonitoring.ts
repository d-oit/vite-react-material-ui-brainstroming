/**
 * Performance monitoring utilities for the application
 */

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
    this.logger = new LoggerService('PerformanceMonitoring');
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
  public endMeasure(id: string, additionalMetadata?: Record<string, any>): number {
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
    this.logger.info(`Performance metric: ${metric.name}`, {
      category: metric.category,
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
    metadataFn?: (...args: any[]) => Record<string, any>
  ) {
    const performanceService = this;

    return function(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = function(...args: any[]) {
        const metricName = `${target.constructor.name}.${propertyKey}`;
        const metadata = metadataFn ? metadataFn(...args) : undefined;

        const metricId = performanceService.startMeasure(metricName, category, metadata);

        try {
          const result = originalMethod.apply(this, args);

          // Handle promises
          if (result instanceof Promise) {
            return result.finally(() => {
              performanceService.endMeasure(metricId);
            });
          }

          performanceService.endMeasure(metricId);
          return result;
        } catch (error) {
          performanceService.endMeasure(metricId, { error: error.message });
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
  public wrapComponent<P>(
    Component: React.ComponentType<P>,
    name?: string
  ): React.FC<P> {
    const performanceService = this;
    const componentName = name || Component.displayName || Component.name || 'UnknownComponent';

    const WrappedComponent: React.FC<P> = (props) => {
      const metricId = React.useRef<string>('');

      React.useEffect(() => {
        metricId.current = performanceService.startMeasure(
          `${componentName}_render`,
          PerformanceCategory.RENDERING,
          { props: Object.keys(props) }
        );

        return () => {
          performanceService.endMeasure(metricId.current);
        };
      }, []);

      return React.createElement(Component, props);
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
    const categorized = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Log each category
    Object.entries(categorized).forEach(([category, metrics]) => {
      console.group(`Category: ${category}`);

      // Sort by duration (descending)
      metrics
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .forEach(metric => {
          console.log(
            `${metric.name}: ${metric.duration?.toFixed(2)}ms`,
            metric.metadata || ''
          );
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
export function useRenderPerformance(
  componentName: string,
  dependencies: React.DependencyList = []
): void {
  const metricId = React.useRef<string>('');

  React.useEffect(() => {
    metricId.current = performanceMonitoring.startMeasure(
      `${componentName}_render`,
      PerformanceCategory.RENDERING
    );

    return () => {
      performanceMonitoring.endMeasure(metricId.current);
    };
  }, dependencies);
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
export function withPerformanceMonitoring<P>(
  Component: React.ComponentType<P>,
  name?: string
): React.FC<P> {
  return performanceMonitoring.wrapComponent(Component, name);
}

export default performanceMonitoring;
