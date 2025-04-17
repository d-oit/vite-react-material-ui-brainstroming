import type { Project } from '../types';

import { performanceTracker, PerformanceCategory } from './performanceMonitoring';

/**
 * Compares two projects to determine if there are any meaningful changes
 * @param currentProject The current project state
 * @param previousProject The previous project state to compare against
 * @returns True if the projects have meaningful differences, false otherwise
 */
export function hasProjectChanged(
  currentProject: Project | null,
  previousProject: Project | null
): boolean {
  // Start performance measurement
  const metricId = performanceTracker.startMeasure(
    'hasProjectChanged',
    PerformanceCategory.PROCESSING
  );

  try {
    // If either project is null, consider it a change if they're not both null
    if (currentProject === null || previousProject === null) {
      return currentProject !== previousProject;
    }

    // Check for missing properties
    if (
      !currentProject.nodes ||
      !previousProject.nodes ||
      !currentProject.edges ||
      !previousProject.edges
    ) {
      return true; // Consider it changed if any essential property is missing
    }

    // Quick checks for primitive properties first (these are fast)
    if (currentProject.name !== previousProject.name) return true;
    if (currentProject.description !== previousProject.description) return true;

    // Check if nodes have changed - compare length first (fast check)
    if (currentProject.nodes.length !== previousProject.nodes.length) return true;

    // Check if edges have changed - compare length first (fast check)
    if (currentProject.edges.length !== previousProject.edges.length) return true;

    // Check sync settings - compare individual properties instead of stringifying
    const currentSync = currentProject.syncSettings;
    const prevSync = previousProject.syncSettings;
    if (currentSync.enableS3Sync !== prevSync.enableS3Sync) return true;
    if (currentSync.syncFrequency !== prevSync.syncFrequency) return true;
    if (currentSync.intervalMinutes !== prevSync.intervalMinutes) return true;

    // Only do deep comparison if necessary - more expensive operations
    // Use a more efficient approach than JSON.stringify for large arrays

    // Check nodes for changes
    for (let i = 0; i < currentProject.nodes.length; i++) {
      const currentNode = currentProject.nodes[i];
      const prevNode = previousProject.nodes[i];

      // Compare essential node properties
      if (currentNode.id !== prevNode.id) return true;
      if (currentNode.type !== prevNode.type) return true;
      if (currentNode.position.x !== prevNode.position.x) return true;
      if (currentNode.position.y !== prevNode.position.y) return true;

      // Compare node data
      const currentData = currentNode.data;
      const prevData = prevNode.data;
      if (currentData.title !== prevData.title) return true;
      if (currentData.content !== prevData.content) return true;
      if (currentData.type !== prevData.type) return true;
    }

    // Check edges for changes
    for (let i = 0; i < currentProject.edges.length; i++) {
      const currentEdge = currentProject.edges[i];
      const prevEdge = previousProject.edges[i];

      if (currentEdge.id !== prevEdge.id) return true;
      if (currentEdge.source !== prevEdge.source) return true;
      if (currentEdge.target !== prevEdge.target) return true;
      if (currentEdge.type !== prevEdge.type) return true;
    }

    // No changes detected
    return false;
  } finally {
    // End performance measurement
    performanceTracker.endMeasure(metricId);
  }
}
