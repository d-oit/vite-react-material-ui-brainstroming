/**
 * Performance monitoring utilities for the application
 *
 * This file re-exports from performanceTracker.ts for backward compatibility
 */

import type { PerformanceMetric } from './performanceTracker'
import {
	performanceTracker,
	performanceMonitoring,
	PerformanceCategory,
	MetricCategory,
	PerformanceBudget,
	useRenderPerformance,
	useMountPerformance,
	withPerformanceTracking,
	withPerformanceMonitoring,
	measurePerformance,
} from './performanceTracker'

// Re-export everything for backward compatibility
export type { PerformanceMetric }
export {
	PerformanceCategory,
	MetricCategory,
	PerformanceBudget,
	useRenderPerformance,
	useMountPerformance,
	withPerformanceTracking,
	withPerformanceMonitoring,
	measurePerformance,
	performanceTracker,
}

// Default export for backward compatibility
export default performanceMonitoring
