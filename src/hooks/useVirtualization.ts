import { useMemo } from 'react';

import type { Node } from '../types';

interface VirtualizationOptions {
  itemHeight: number;
  overscan?: number;
  visibleItems?: number;
}

export function useVirtualization<T extends Node>(items: T[], options: VirtualizationOptions): T[] {
  const {
    itemHeight,
    overscan = 5,
    visibleItems = Math.ceil(window.innerHeight / itemHeight),
  } = options;

  return useMemo(() => {
    if (!items.length) return items;

    // Calculate visible range with overscan
    const startIndex = Math.max(0, 0 - overscan);
    const endIndex = Math.min(items.length, visibleItems + overscan);

    // Return only the items in the visible range
    return items.slice(startIndex, endIndex);
  }, [items, overscan, visibleItems, itemHeight]);
}

export default useVirtualization;
