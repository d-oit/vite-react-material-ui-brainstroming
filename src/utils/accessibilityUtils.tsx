import React, { useEffect, useRef, useState } from 'react'

/**
 * Hook to announce messages to screen readers
 * @returns Object with announce function and announcer component
 */
export function useScreenReaderAnnouncer() {
	const [announcement, setAnnouncement] = useState('')

	const announce = (newMessage: string) => {
		setAnnouncement(newMessage)
		setTimeout(() => setAnnouncement(''), 5000)
	}

	const ScreenReaderAnnouncer = () => (
		<div
			role="status"
			aria-live="polite"
			aria-atomic="true"
			style={{
				position: 'absolute',
				width: '1px',
				height: '1px',
				padding: 0,
				margin: '-1px',
				overflow: 'hidden',
				clip: 'rect(0, 0, 0, 0)',
				whiteSpace: 'nowrap',
				border: 0,
			}}
		>
			{announcement}
		</div>
	)

	return { announce, ScreenReaderAnnouncer }
}

/**
 * Check if an element has sufficient color contrast
 * @param foreground Foreground color in hex format (e.g., #ffffff)
 * @param background Background color in hex format (e.g., #000000)
 * @param isLargeText Whether the text is large (>=18pt or >=14pt bold)
 * @returns Object containing contrast ratio and WCAG AA/AAA compliance
 */
export function checkColorContrast(
	foreground: string,
	background: string,
	isLargeText = false,
): {
	ratio: number,
	isWCAGAA: boolean,
	isWCAGAAA: boolean,
} {
	// Convert hex to RGB
	const hexToRgb = (hex: string): number[] => {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
		const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b)
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex)
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [0, 0, 0]
	}

	// Calculate relative luminance
	const calculateLuminance = (rgb: number[]): number => {
		const [r, g, b] = rgb.map((c) => {
			const value = c / 255
			return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
		})
		return 0.2126 * r + 0.7152 * g + 0.0722 * b
	}

	const foregroundRgb = hexToRgb(foreground)
	const backgroundRgb = hexToRgb(background)

	const foregroundLuminance = calculateLuminance(foregroundRgb)
	const backgroundLuminance = calculateLuminance(backgroundRgb)

	// Calculate contrast ratio
	const lighterLuminance = Math.max(foregroundLuminance, backgroundLuminance)
	const darkerLuminance = Math.min(foregroundLuminance, backgroundLuminance)
	const contrastRatio = (lighterLuminance + 0.05) / (darkerLuminance + 0.05)

	// Check WCAG compliance
	const isWCAGAA = isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5
	const isWCAGAAA = isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7

	return {
		ratio: contrastRatio,
		isWCAGAA,
		isWCAGAAA,
	}
}

/**
 * Generate an accessible label for an element
 * @param baseLabel Base label text
 * @param context Additional context
 * @param count Optional count
 * @returns Accessible label
 */
export function generateAccessibleLabel(
	baseLabel: string,
	context?: string,
	count?: number,
): string {
	let label = baseLabel

	if (count !== undefined) {
		label = `${label} (${count})`
	}

	if (context) {
		label = `${label} - ${context}`
	}

	return label
}

/**
 * Hook to manage focus trap within a component
 * @param active Whether the focus trap is active
 * @param initialFocusRef Ref to the element that should receive initial focus
 * @returns Ref to attach to the container element
 */
export function useFocusTrap(
	active: boolean,
	initialFocusRef?: React.RefObject<HTMLElement>,
): React.RefObject<HTMLElement> {
	const containerRef = useRef<HTMLDivElement>(null)
	const previousFocusRef = useRef<HTMLElement | null>(null)

	useEffect(() => {
		if (!active) return

		// Save current focus
		previousFocusRef.current = document.activeElement as HTMLElement

		// Set initial focus
		if (initialFocusRef?.current) {
			initialFocusRef.current.focus()
		} else if (containerRef.current) {
			// Find the first focusable element
			const focusableElements = containerRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)
			if (focusableElements.length > 0) {
				(focusableElements[0] as HTMLElement).focus()
			}
		}

		// Handle tab key to trap focus
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab' || !containerRef.current) return

			const focusableElements = containerRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			)

			if (focusableElements.length === 0) return

			const firstElement = focusableElements[0] as HTMLElement
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

			if (event.shiftKey && document.activeElement === firstElement) {
				lastElement.focus()
				event.preventDefault()
			} else if (!event.shiftKey && document.activeElement === lastElement) {
				firstElement.focus()
				event.preventDefault()
			}
		}

		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)

			// Restore focus when unmounting
			if (active && previousFocusRef.current) {
				previousFocusRef.current.focus()
			}
		}
	}, [active, initialFocusRef])

	return containerRef
}

/**
 * Hook to detect when a user is navigating with keyboard
 * @returns Whether the user is navigating with keyboard
 */
export function useKeyboardNavigation(): boolean {
	const [isKeyboardUser, setIsKeyboardUser] = useState(false)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Tab') {
				setIsKeyboardUser(true)
			}
		}

		const handleMouseDown = () => {
			setIsKeyboardUser(false)
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('mousedown', handleMouseDown)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('mousedown', handleMouseDown)
		}
	}, [])

	return isKeyboardUser
}

/**
 * Add accessibility attributes to an element
 * @param props Base props
 * @param label Accessible label
 * @param description Accessible description
 * @param expanded Whether the element is expanded
 * @param controls ID of the element controlled by this element
 * @returns Props with accessibility attributes
 */
export function withAccessibilityProps<T extends object>(
	props: T,
	label?: string,
	description?: string,
	expanded?: boolean,
	controls?: string,
): T & {
	'aria-label'?: string,
	'aria-describedby'?: string,
	'aria-expanded'?: boolean,
	'aria-controls'?: string,
} {
	const accessibilityProps = { ...props } as Record<string, unknown>

	if (label) {
		accessibilityProps['aria-label'] = label
	}

	if (description) {
		accessibilityProps['aria-describedby'] = description
	}

	if (expanded !== undefined) {
		accessibilityProps['aria-expanded'] = expanded
	}

	if (controls) {
		accessibilityProps['aria-controls'] = controls
	}

	return accessibilityProps as T & {
		'aria-label'?: string,
		'aria-describedby'?: string,
		'aria-expanded'?: boolean,
		'aria-controls'?: string,
	}
}

export default {
	checkColorContrast,
	generateAccessibleLabel,
	useFocusTrap,
	useScreenReaderAnnouncer,
	useKeyboardNavigation,
	withAccessibilityProps,
}
