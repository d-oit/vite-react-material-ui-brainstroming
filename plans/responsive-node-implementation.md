# Responsive Node Implementation Plan

## Overview
This document outlines the technical implementation details for responsive node design and customization features, building on the existing plans for color storage and settings export/import.

## 1. IndexedDB Service Enhancement

### Current Structure
- Create base IndexedDB service for color storage
- Connect to SettingsContext for state management

### Enhancements Needed
- Extend schema to include node size preferences
- Add methods for storing and retrieving node appearance settings
- Support for both global and per-node settings

```json
{
  "nodePreferences": {
    "defaultSize": "medium",
    "defaultColor": "#e3f2fd",
    "customColors": {
      "idea": "#e3f2fd",
      "task": "#e8f5e9",
      "note": "#fff8e1",
      "resource": "#f3e5f5"
    },
    "nodeSizes": {
      "small": { "width": 150, "fontSize": 0.8 },
      "medium": { "width": 200, "fontSize": 1 },
      "large": { "width": 250, "fontSize": 1.2 }
    }
  }
}
```

## 2. Component Updates

### CustomNode Component
- Add responsive sizing logic based on viewport width
- Implement dynamic styling based on user preferences
- Support for mobile-specific rendering

### NodeEditDialog Component
- Add size selection controls
- Integrate color picker with presets
- Provide live preview of appearance changes

### SettingsContext Updates
- Add node appearance state management
- Methods for updating global and per-node settings
- Connect to IndexedDB for persistence

## 3. Responsive Design Implementation

### Viewport-Based Sizing
- Use media queries and React hooks for viewport detection
- Scale node dimensions based on available screen width
- Adjust font sizes and padding proportionally

### Mobile Optimizations
- Collapsible content sections for small screens
- Larger touch targets for handles and controls
- Simplified UI for mobile view

## 4. Settings Integration

### Export/Import Enhancement
- Include node appearance settings in exported JSON
- Apply imported appearance settings
- Validate settings during import

### Settings UI
- Add node appearance section to settings page
- Provide visual previews of size options
- Include color theme selection with presets

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Extend IndexedDB schema
- Update SettingsContext
- Create basic responsive sizing logic

### Phase 2: UI Components (Week 2)
- Enhance CustomNode with responsive features
- Update NodeEditDialog with customization options
- Implement mobile-specific optimizations

### Phase 3: Settings Integration (Week 3)
- Connect to settings export/import
- Create node appearance settings UI
- Add validation and preview functionality

### Phase 4: Testing & Refinement (Week 4)
- Cross-device testing
- Performance optimization
- User feedback integration

## 6. Technical Considerations

### Performance
- Optimize rendering for large node graphs
- Minimize unnecessary re-renders
- Efficient state management for appearance settings

### Accessibility
- Maintain proper contrast ratios with custom colors
- Ensure touch targets meet accessibility guidelines
- Support keyboard navigation for all customization options

### Browser Compatibility
- Test across modern browsers
- Ensure IndexedDB fallbacks for unsupported browsers
- Progressive enhancement approach