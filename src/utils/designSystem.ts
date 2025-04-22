/**
 * Design System Utilities
 *
 * This file contains utilities for working with the design system,
 * including theme helpers, spacing utilities, and responsive design tools.
 */

import { useMediaQuery, useTheme } from '@mui/material'
import type { Theme, SxProps } from '@mui/material/styles'

/**
 * Spacing values in the design system (in pixels)
 */
export const Spacing = {
	NONE: 0,
	EXTRA_SMALL: 4,
	SMALL: 8,
	MEDIUM: 16,
	LARGE: 24,
	EXTRA_LARGE: 32,
	HUGE: 48,
}

/**
 * Font sizes in the design system (in pixels)
 */
export const FontSize = {
	EXTRA_SMALL: 12,
	SMALL: 14,
	MEDIUM: 16,
	LARGE: 18,
	EXTRA_LARGE: 20,
	HEADING_6: 20,
	HEADING_5: 24,
	HEADING_4: 28,
	HEADING_3: 32,
	HEADING_2: 40,
	HEADING_1: 48,
}

/**
 * Border radius values in the design system (in pixels)
 */
export const BorderRadius = {
	NONE: 0,
	SMALL: 4,
	MEDIUM: 8,
	LARGE: 12,
	EXTRA_LARGE: 16,
	CIRCLE: '50%',
}

/**
 * Elevation values (box shadows) in the design system
 */
export const Elevation = {
	NONE: 0,
	LOW: 1,
	MEDIUM: 2,
	HIGH: 4,
	EXTRA_HIGH: 8,
}

/**
 * Z-index values in the design system
 */
export const ZIndex = {
	BACKGROUND: -1,
	DEFAULT: 0,
	CONTENT: 1,
	CANVAS: 5,
	TOOLBAR: 10,
	CONTROLS: 20,
	OVERLAY: 50,
	DRAWER: 1200,
	MODAL: 1300,
	TOOLTIP: 1400,
	NOTIFICATION: 1500,
	POPOVER: 1600,
	SNACKBAR: 1700,
	FAB: 1800,
}

/**
 * Breakpoints in the design system (in pixels)
 */
export const Breakpoints = {
	XS: 0,
	SM: 600,
	MD: 960,
	LG: 1280,
	XL: 1920,
}

/**
 * Animation durations in the design system (in milliseconds)
 */
export const AnimationDuration = {
	EXTRA_FAST: 100,
	FAST: 200,
	MEDIUM: 300,
	SLOW: 500,
	EXTRA_SLOW: 800,
}

/**
 * Hook to get responsive values based on screen size
 * @param values Object containing values for different breakpoints
 * @returns The value for the current screen size
 */
export function useResponsiveValue<T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; default: T }): T {
	const theme = useTheme()
	const isXs = useMediaQuery(theme.breakpoints.only('xs'))
	const isSm = useMediaQuery(theme.breakpoints.only('sm'))
	const isMd = useMediaQuery(theme.breakpoints.only('md'))
	const isLg = useMediaQuery(theme.breakpoints.only('lg'))
	const isXl = useMediaQuery(theme.breakpoints.only('xl'))

	if (isXs && values.xs !== undefined) return values.xs
	if (isSm && values.sm !== undefined) return values.sm
	if (isMd && values.md !== undefined) return values.md
	if (isLg && values.lg !== undefined) return values.lg
	if (isXl && values.xl !== undefined) return values.xl

	return values.default
}

/**
 * Get responsive styles based on screen size
 * @param styles Object containing styles for different breakpoints
 * @returns SxProps object with responsive styles
 */
export function getResponsiveStyles(styles: {
	xs?: SxProps<Theme>
	sm?: SxProps<Theme>
	md?: SxProps<Theme>
	lg?: SxProps<Theme>
	xl?: SxProps<Theme>
	base: SxProps<Theme>
}): SxProps<Theme> {
	const { base, ...breakpointStyles } = styles
	const result: SxProps<Theme> = { ...base }

	Object.entries(breakpointStyles).forEach(([breakpoint, style]) => {
		if (style) {
			result[`@media (min-width: ${Breakpoints[breakpoint.toUpperCase() as keyof typeof Breakpoints]}px)`] = style
		}
	})

	return result
}

/**
 * Get a color with specified opacity
 * @param color Base color (hex, rgb, or theme color)
 * @param opacity Opacity value (0-1)
 * @returns Color with opacity
 */
export function getColorWithOpacity(color: string, opacity: number): string {
	// If it's a hex color
	if (color.startsWith('#')) {
		const hexToRgb = (hex: string): number[] => {
			const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
			const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex)
			return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
		}

		const [r, g, b] = hexToRgb(color)
		return `rgba(${r}, ${g}, ${b}, ${opacity})`
	}

	// If it's already an rgba color
	if (color.startsWith('rgba')) {
		return color.replace(/rgba\((.+?), .+?\)/, `rgba($1, ${opacity})`)
	}

	// If it's an rgb color
	if (color.startsWith('rgb')) {
		return color.replace(/rgb/, 'rgba').replace(/\)/, `, ${opacity})`)
	}

	// For theme colors or other formats, we need the theme context
	// This should be used within a component with the useTheme hook
	return `${color}${opacity * 100}`
}

/**
 * Get spacing value in pixels
 * @param size Spacing size
 * @returns Spacing value in pixels
 */
export function getSpacing(size: keyof typeof Spacing): number {
	return Spacing[size]
}

/**
 * Get font size value in pixels
 * @param size Font size
 * @returns Font size value in pixels
 */
export function getFontSize(size: keyof typeof FontSize): number {
	return FontSize[size]
}

/**
 * Get border radius value
 * @param size Border radius size
 * @returns Border radius value
 */
export function getBorderRadius(size: keyof typeof BorderRadius): number | string {
	return BorderRadius[size]
}

/**
 * Get elevation value
 * @param level Elevation level
 * @returns Elevation value
 */
export function getElevation(level: keyof typeof Elevation): number {
	return Elevation[level]
}

/**
 * Get z-index value
 * @param level Z-index level
 * @returns Z-index value
 */
export function getZIndex(level: keyof typeof ZIndex): number {
	return ZIndex[level]
}

/**
 * Get animation duration value in milliseconds
 * @param speed Animation speed
 * @returns Animation duration value in milliseconds
 */
export function getAnimationDuration(speed: keyof typeof AnimationDuration): number {
	return AnimationDuration[speed]
}

/**
 * Hook to get device type
 * @returns Object with boolean flags for different device types
 */
export function useDeviceType(): {
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
	isLargeDesktop: boolean
} {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
	const isDesktop = useMediaQuery(theme.breakpoints.between('md', 'lg'))
	const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'))

	return {
		isMobile,
		isTablet,
		isDesktop,
		isLargeDesktop,
	}
}

export default {
	Spacing,
	FontSize,
	BorderRadius,
	Elevation,
	ZIndex,
	Breakpoints,
	AnimationDuration,
	useResponsiveValue,
	getResponsiveStyles,
	getColorWithOpacity,
	getSpacing,
	getFontSize,
	getBorderRadius,
	getElevation,
	getZIndex,
	getAnimationDuration,
	useDeviceType,
}
