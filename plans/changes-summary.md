# Implementation Plans Summary

This document summarizes the planned changes across different features.

## UI and Connectivity Updates

### Network Status Indicator
- Remove network status icon from main layout
- Keep network status icon only in the header
- Ensure consistent visual feedback about connectivity status

### LLM Chat Integration
- Replace LLM chat icon with offline-aware indicator
- Add user-friendly explanation when offline
- Disable LLM chat functionality when offline

### S3 Synchronization
- Make S3 synchronization only available when online
- Disable sync UI elements when offline
- Queue synchronization operations for when connection is restored

## Color Storage and Settings Export/Import

### IndexedDB Color Storage
- Create IndexedDB service for color storage in `src/services/IndexedDBService.ts`
- Add color management to `SettingsContext`
- Update UI components to use stored colors
- Persist colors across sessions

### Settings Export/Import
- Add export functionality to generate downloadable JSON files
- Create import mechanism with file validation
- Update `SettingsContext` to handle bulk settings updates
- Implement success/error notifications

## Responsive Node Design and Customization

### Responsive Node Design
- Create adaptive node sizing based on viewport width
- Implement collapsible content for mobile view
- Optimize handle positions for touch interfaces

### Node Size Customization
- Add size controls (small, medium, large) to node settings
- Create size presets with appropriate dimensions
- Store size preferences in IndexedDB
- Apply size settings to all nodes or individual nodes

### Node Color Customization
- Enhance `CustomNode` component with color props
- Add color picker to node edit dialog
- Store color preferences in IndexedDB
- Apply color settings to nodes

### Mobile-Specific Optimizations
- Create mobile-specific node rendering
- Implement touch gestures for node manipulation
- Design compact node layout for small screens

## Project Management and Node Operations

### Project Save/Load Functionality
- Implement auto-save with configurable timer (currently 5 seconds)
- Add manual save option with visual feedback
- Ensure proper state updates when saving projects
- Implement version control with incremental versioning

### Node Operations
- Fix node deletion to properly remove nodes and connected edges
- Add confirmation dialog for node deletion with skip option
- Implement proper event handling for node operations
- Add snackbar notifications for node operations

## Implementation Timeline

1. **Phase 1: Core Infrastructure**
   - IndexedDB service implementation
   - Settings context enhancements
   - Fix node deletion functionality

2. **Phase 2: Color Management**
   - Color storage implementation
   - UI updates for color selection

3. **Phase 3: Settings Export/Import**
   - Export functionality
   - Import with validation

4. **Phase 4: Responsive Design**
   - Adaptive node sizing
   - Mobile optimizations

5. **Phase 5: Node Customization**
   - Size controls
   - Color customization

---

## React Flow Node Appearance Optimization & Tag Reordering

### Overview
Enhance the `CustomNode` component to improve responsiveness, maintainability, and UI hierarchy by:

- Centralizing responsive sizing logic into a dedicated function.
- Rearranging the tags section to appear before the main content text.
- Fixing node deletion functionality to ensure proper removal.

### 1. Optimize Node Appearance with a Dedicated Function

- **Create** a function `getOptimizedNodeStyle` that:
  - Accepts `nodePreferences`, `data.size`, `isMobile`, and `viewportWidth`.
  - Returns an object with `width` and `fontSize` optimized for the device and preferences.
- **Replace** the current inline sizing logic with a call to this function inside a `useMemo`.
- **Benefits:**
  - Cleaner, centralized logic.
  - Easier future adjustments.
  - Improved maintainability.

**Sample function:**

```tsx
const getOptimizedNodeStyle = (
  nodePreferences,
  nodeSizeKey,
  isMobile,
  viewportWidth
) => {
  if (!nodePreferences) return { width: 200, fontSize: 1 };

  const size = nodeSizeKey || nodePreferences.defaultSize;
  const sizeConfig = nodePreferences.nodeSizes[size];

  if (isMobile) {
    return {
      width: Math.min(sizeConfig.width, viewportWidth * 0.8),
      fontSize: sizeConfig.fontSize * 0.9,
    };
  } else if (viewportWidth < 1024) {
    return {
      width: Math.min(sizeConfig.width, viewportWidth * 0.4),
      fontSize: sizeConfig.fontSize * 0.95,
    };
  }
  return sizeConfig;
};
```

### 2. Rearrange Tags Before Content

- **Move** the tags container `<Box>` **above** the content `<Typography>` inside `<CardContent>`.
- This change improves information hierarchy by making tags more prominent.

### 3. Fix Node Deletion Functionality

- Ensure proper event propagation when deleting nodes
- Update node deletion to properly remove from state
- Add confirmation dialog with option to skip in settings
- Ensure edges connected to deleted nodes are also removed
- Add visual feedback with snackbar notifications

### 4. Additional Recommendations

- Add subtle background or border to tags container for distinction.
- Maintain consistent spacing between tags and content.
- Ensure accessibility with sufficient contrast and `aria-labels` if needed.

---

This plan will improve the React Flow node's responsiveness, maintainability, and user experience.
