# Responsive Node Design and Customization Plan

## 1. Responsive Node Design

### Current Limitations
- Fixed node sizes don't adapt well to mobile screens
- Limited customization options for node appearance
- No persistence of visual preferences

### Requirements
- Fully responsive nodes that adapt to screen size
- Optimized layout for mobile devices
- Fluid transitions between screen sizes

### Implementation Approach
1. Create adaptive node sizing based on viewport width
2. Implement collapsible content for mobile view
3. Optimize handle positions and interaction areas for touch

## 2. Node Size Customization

### Requirements
- Allow users to adjust node size (small, medium, large)
- Persist size preferences in IndexedDB
- Apply size settings consistently across all nodes

### Implementation Steps
1. Add size controls to node settings
2. Create size presets with appropriate dimensions
3. Store size preferences in IndexedDB
4. Apply size settings to all nodes or individual nodes

## 3. Node Color Customization

### Requirements
- Enable custom color selection for nodes
- Allow color themes or individual node coloring
- Persist color preferences in IndexedDB

### Implementation Steps
1. Enhance `CustomNode` component with color props
2. Add color picker to node edit dialog
3. Store color preferences in IndexedDB
4. Apply color settings to nodes

## 4. Mobile-Specific Optimizations

### Requirements
- Touch-friendly node interactions
- Simplified node UI for small screens
- Efficient use of limited screen space

### Implementation Steps
1. Create mobile-specific node rendering
2. Implement touch gestures for node manipulation
3. Design compact node layout for small screens

## 5. Technical Implementation Details

### IndexedDB Schema Updates
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

### Component Updates

#### CustomNode.tsx
- Add responsive sizing logic
- Implement dynamic styling based on screen size
- Apply user preferences from context

#### NodeEditDialog.tsx
- Add size selection dropdown
- Enhance color picker with presets and custom options
- Preview node appearance with selected settings

#### SettingsContext.tsx
- Add node appearance preferences
- Connect to IndexedDB for persistence
- Provide methods for bulk updates

## 6. UI Design Mockups

### Desktop Node
- Full-featured node with all content visible
- Standard interaction handles
- Rich formatting and tag display

### Tablet Node
- Slightly condensed layout
- Optimized for both touch and mouse
- Collapsible secondary content

### Mobile Node
- Compact design with essential information
- Expandable on tap for full content
- Larger touch targets for handles

## 7. Settings UI Updates

### Node Appearance Settings
- Size presets with visual examples
- Color theme selection with preview
- Option to reset to defaults

### Export/Import Integration
- Include node appearance settings in export
- Apply imported appearance settings
- Validate settings during import

## 8. Implementation Phases

### Phase 1: Core Responsive Design
- Implement basic responsive sizing
- Create mobile-optimized node layout
- Test across device sizes

### Phase 2: Customization Options
- Add size selection to settings
- Implement color customization
- Connect to IndexedDB for persistence

### Phase 3: Settings Integration
- Include node preferences in settings export/import
- Add node appearance section to settings page
- Implement preview functionality