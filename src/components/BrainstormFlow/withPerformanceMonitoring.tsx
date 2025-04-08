import React, { useEffect } from 'react';

import { withPerformanceMonitoring as performanceMonitoringHOC } from '../../utils/performanceTracker';

/**
 * Higher-order component that adds performance monitoring to a component
 * @param Component The component to wrap
 * @param componentName The name of the component for metrics
 */
export function withPerformanceMonitoring<P>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return performanceMonitoringHOC(Component, componentName);
}

export default withPerformanceMonitoring;
