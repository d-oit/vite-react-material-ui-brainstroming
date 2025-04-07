import React, { useEffect } from 'react';
import performanceMonitoring, { PerformanceCategory } from '../../utils/performanceMonitoring';

/**
 * Higher-order component that adds performance monitoring to a component
 * @param Component The component to wrap
 * @param componentName The name of the component for metrics
 */
export function withPerformanceMonitoring<P>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    // Start measuring when the component mounts
    useEffect(() => {
      const metricId = performanceMonitoring.startMeasure(
        `${componentName}_render`,
        PerformanceCategory.RENDERING,
        { props: Object.keys(props) }
      );
      
      return () => {
        performanceMonitoring.endMeasure(metricId);
      };
    }, []);
    
    // Measure interactions
    const handleInteraction = (interactionType: string) => {
      const metricId = performanceMonitoring.startMeasure(
        `${componentName}_${interactionType}`,
        PerformanceCategory.USER_INTERACTION
      );
      
      return () => {
        performanceMonitoring.endMeasure(metricId);
      };
    };
    
    // Pass the handleInteraction function to the wrapped component
    const enhancedProps = {
      ...props,
      onPerformanceInteraction: handleInteraction,
    } as P;
    
    return <Component {...enhancedProps} />;
  };
  
  WrappedComponent.displayName = `WithPerformanceMonitoring(${componentName})`;
  
  return WrappedComponent;
}

export default withPerformanceMonitoring;
