import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

import type { SyncSettings } from '../types/project';

interface S3SyncPayload {
  nodes: unknown[];
  edges: unknown[];
}

interface UseS3SyncProps {
  projectId: string;
  syncSettings?: SyncSettings;
  data: S3SyncPayload;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const s3SyncPayloadSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

export const useS3Sync = ({ projectId, syncSettings, data }: UseS3SyncProps) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  const validatePayload = (payload: S3SyncPayload): boolean => {
    try {
      s3SyncPayloadSchema.parse(payload);
      return true;
    } catch (error) {
      console.error('Invalid sync payload:', error);
      return false;
    }
  };

  const sync = useCallback(async () => {
    if (typeof syncSettings !== 'object' || syncSettings === null) {
      return;
    }

    const { enableS3Sync, s3Path } = syncSettings;
    const isEnabled = enableS3Sync === true;
    const hasPath = typeof s3Path === 'string' && s3Path.length > 0;

    if (!isEnabled || !hasPath) {
      return;
    }

    if (!validatePayload(data)) {
      setSyncStatus('error');
      return;
    }

    setSyncStatus('syncing');

    try {
      const response = await fetch('/api/s3/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          s3Path,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      setLastSyncTime(new Date().toISOString());
      setSyncStatus('success');
      setRetryCount(0);
    } catch (error) {
      console.error('S3 sync error:', error);
      setSyncStatus('error');

      if (typeof retryCount === 'number' && retryCount >= 0 && retryCount < MAX_RETRIES) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
          void sync();
        }, backoffDelay);
      }
    }
  }, [projectId, syncSettings, data, retryCount]);

  useEffect(() => {
    if (typeof syncSettings === 'undefined') {
      return;
    }

    const { enableS3Sync, syncFrequency, intervalMinutes } = syncSettings;
    const isEnabled = typeof enableS3Sync === 'boolean' && enableS3Sync;
    const isIntervalSync = syncFrequency === 'interval';
    const minutes =
      typeof intervalMinutes === 'number' && !Number.isNaN(intervalMinutes) ? intervalMinutes : 0;

    if (isEnabled === true && isIntervalSync && minutes > 0) {
      const intervalId = setInterval(
        () => {
          void sync();
        },
        minutes * 60 * 1000
      );

      return () => clearInterval(intervalId);
    }
  }, [sync, syncSettings]);

  return {
    sync,
    syncStatus,
    lastSyncTime,
  };
};
