import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import performanceMonitoring, {
  PerformanceCategory,
  measurePerformance,
  useRenderPerformance
} from '../../utils/performanceMonitoring';
import { renderHook } from '@testing-library/react';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Reset performance monitoring
    performanceMonitoring.clearMetrics();
    performanceMonitoring.setEnabled(true);

    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => 1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should measure performance correctly', () => {
      // Start measuring
      const metricId = performanceMonitoring.startMeasure(
        'test-metric',
        PerformanceCategory.RENDERING
      );

      // Mock performance.now to return a different value for end time
      vi.spyOn(performance, 'now').mockImplementation(() => 1500);

      // End measuring
      const duration = performanceMonitoring.endMeasure(metricId);

      // Check duration
      expect(duration).toBe(500);

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].category).toBe(PerformanceCategory.RENDERING);
      expect(metrics[0].duration).toBe(500);
    });

    it('should handle disabled state', () => {
      // Disable performance monitoring
      performanceMonitoring.setEnabled(false);

      // Start measuring
      const metricId = performanceMonitoring.startMeasure(
        'test-metric',
        PerformanceCategory.RENDERING
      );

      // End measuring
      const duration = performanceMonitoring.endMeasure(metricId);

      // Check duration
      expect(duration).toBe(0);

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should handle invalid metric IDs', () => {
      // End measuring with invalid ID
      const duration = performanceMonitoring.endMeasure('invalid-id');

      // Check duration
      expect(duration).toBe(0);

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should clear metrics', () => {
      // Start and end a metric
      const metricId = performanceMonitoring.startMeasure(
        'test-metric',
        PerformanceCategory.RENDERING
      );
      performanceMonitoring.endMeasure(metricId);

      // Check metrics
      let metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(1);

      // Clear metrics
      performanceMonitoring.clearMetrics();

      // Check metrics again
      metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('Method Decorator', () => {
    it('should create a method decorator that measures performance', () => {
      // Create a class with a decorated method
      class TestClass {
        @measurePerformance(PerformanceCategory.DATA_LOADING)
        public testMethod() {
          return 'test';
        }
      }

      // Create an instance
      const instance = new TestClass();

      // Mock performance.now to return different values
      const nowMock = vi.spyOn(performance, 'now');
      nowMock.mockImplementationOnce(() => 1000);
      nowMock.mockImplementationOnce(() => 1200);

      // Call the method
      const result = instance.testMethod();

      // Check result
      expect(result).toBe('test');

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('TestClass.testMethod');
      expect(metrics[0].category).toBe(PerformanceCategory.DATA_LOADING);
      expect(metrics[0].duration).toBe(200);
    });

    it('should handle async methods', async () => {
      // Create a class with a decorated async method
      class TestClass {
        @measurePerformance(PerformanceCategory.NETWORK)
        public async testAsyncMethod() {
          return 'async test';
        }
      }

      // Create an instance
      const instance = new TestClass();

      // Mock performance.now to return different values
      const nowMock = vi.spyOn(performance, 'now');
      nowMock.mockImplementationOnce(() => 1000);
      nowMock.mockImplementationOnce(() => 1300);

      // Call the method
      const result = await instance.testAsyncMethod();

      // Check result
      expect(result).toBe('async test');

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('TestClass.testAsyncMethod');
      expect(metrics[0].category).toBe(PerformanceCategory.NETWORK);
      expect(metrics[0].duration).toBe(300);
    });
  });

  describe('React Hook', () => {
    it('should measure component render performance', () => {
      // Mock performance.now to return different values
      const nowMock = vi.spyOn(performance, 'now');
      nowMock.mockImplementationOnce(() => 1000);
      nowMock.mockImplementationOnce(() => 1100);

      // Render the hook
      const { unmount } = renderHook(() => useRenderPerformance('TestComponent'));

      // Unmount to trigger cleanup
      unmount();

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('TestComponent_render');
      expect(metrics[0].category).toBe(PerformanceCategory.RENDERING);
      expect(metrics[0].duration).toBe(100);
    });

    it('should respect dependencies', () => {
      // Mock performance.now
      const nowMock = vi.spyOn(performance, 'now');
      nowMock.mockImplementationOnce(() => 1000);
      nowMock.mockImplementationOnce(() => 1100);

      // Render the hook with dependencies
      const { rerender, unmount } = renderHook(
        ({ deps }) => useRenderPerformance('TestComponent', deps),
        { initialProps: { deps: [1] } }
      );

      // Update dependencies to trigger re-measurement
      nowMock.mockImplementationOnce(() => 1200);
      nowMock.mockImplementationOnce(() => 1400);
      rerender({ deps: [2] });

      // Unmount
      unmount();

      // Check metrics
      const metrics = performanceMonitoring.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics[0].name).toBe('TestComponent_render');
      expect(metrics[0].duration).toBe(100);
      expect(metrics[1].name).toBe('TestComponent_render');
      expect(metrics[1].duration).toBe(200);
    });
  });
});
