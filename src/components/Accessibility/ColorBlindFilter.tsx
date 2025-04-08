import React from 'react';

import { useSettings } from '../../contexts/SettingsContext';

/**
 * SVG filters for different types of color blindness
 * Based on research and algorithms from:
 * - https://www.color-blindness.com/
 * - https://github.com/hail2u/color-blindness-emulation
 */
const colorBlindnessFilters = {
  protanopia: {
    // Red-blind
    id: 'protanopia',
    matrix: [0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0],
  },
  deuteranopia: {
    // Green-blind
    id: 'deuteranopia',
    matrix: [0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0],
  },
  tritanopia: {
    // Blue-blind
    id: 'tritanopia',
    matrix: [0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0],
  },
  achromatopsia: {
    // Monochromacy (no color)
    id: 'achromatopsia',
    matrix: [
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1,
      0,
    ],
  },
};

interface ColorBlindFilterProps {
  children?: React.ReactNode;
}

/**
 * A component that applies color blindness simulation filters to its children.
 * The filter type is determined by the accessibilityPreferences in the SettingsContext.
 */
export const ColorBlindFilter: React.FC<ColorBlindFilterProps> = ({ children }) => {
  const { accessibilityPreferences } = useSettings();
  const colorBlindMode = accessibilityPreferences?.colorBlindMode ?? 'none';

  // If no color blind mode is selected, just render children
  if (colorBlindMode === 'none') {
    return <>{children}</>;
  }

  // Get the filter for the selected color blind mode
  const filter = colorBlindnessFilters[colorBlindMode as keyof typeof colorBlindnessFilters];

  if (filter === undefined || filter === null) {
    console.warn(`Unknown color blind mode: ${colorBlindMode}`);
    return <>{children}</>;
  }

  return (
    <>
      {/* SVG Filters */}
      <svg
        style={{
          position: 'absolute',
          height: 0,
          width: 0,
          overflow: 'hidden',
        }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id={filter.id}>
            <feColorMatrix type="matrix" values={filter.matrix.join(' ')} in="SourceGraphic" />
          </filter>
        </defs>
      </svg>

      {/* Apply filter to children */}
      <div
        style={{
          filter: `url(#${filter.id})`,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default ColorBlindFilter;
