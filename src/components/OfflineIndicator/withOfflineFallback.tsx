import React, { useState, useEffect } from 'react';

import offlineService from '../../services/OfflineService';

import { default as OfflineFallbackComponent } from './OfflineFallback';

interface WithOfflineFallbackOptions {
  requiresNetwork?: boolean;
  customFallback?: React.ReactNode;
  message?: string;
  showActions?: boolean;
}

/**
 * Higher-order component that shows a fallback UI when the application is offline
 * @param WrappedComponent The component to wrap
 * @param options Configuration options
 * @returns A new component that shows a fallback UI when offline
 */
export const withOfflineFallback = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithOfflineFallbackOptions = {}
) => {
  const { requiresNetwork = true, customFallback, message, showActions = true } = options;

  const WithOfflineFallbackComponent: React.FC<P> = props => {
    const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
      const removeListener = offlineService.addOnlineStatusListener(online => {
        setIsOnline(online);
      });

      return () => {
        removeListener();
      };
    }, []);

    const handleRetry = () => {
      // Force a re-render to check online status again
      setRetryCount(prev => prev + 1);
    };

    // If we don't require network or we're online, render the wrapped component
    if (!requiresNetwork || isOnline) {
      return <WrappedComponent {...props} />;
    }

    // Otherwise, render the fallback UI
    if (customFallback !== undefined && customFallback !== null) {
      return <>{customFallback}</>;
    }

    return (
      <OfflineFallbackComponent onRetry={handleRetry} message={message} showActions={showActions} />
    );
  };

  // Set display name for debugging
  const wrappedComponentName =
    (WrappedComponent.displayName ?? WrappedComponent.name) || 'Component';

  WithOfflineFallbackComponent.displayName = `WithOfflineFallback(${wrappedComponentName})`;

  return WithOfflineFallbackComponent;
};

export default withOfflineFallback;
