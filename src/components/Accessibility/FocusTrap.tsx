import React, { useEffect, useRef } from 'react'

interface FocusTrapProps {
	active: boolean
	children: React.ReactNode
	initialFocusRef?: React.RefObject<HTMLElement>
	returnFocusRef?: React.RefObject<HTMLElement>
	onEscape?: () => void
}

/**
 * A component that traps focus within its children when active.
 * This is useful for modals, dialogs, and other components that should
 * trap focus for accessibility purposes.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
	active,
	children,
	initialFocusRef,
	returnFocusRef,
	onEscape,
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const previousFocusRef = useRef<HTMLElement | null>(null)

	// Save the previously focused element when the trap becomes active
	useEffect(() => {
		if (active) {
			previousFocusRef.current = document.activeElement as HTMLElement
		}
	}, [active])

	// Set focus to the initial element when the trap becomes active
	useEffect(() => {
		if (active) {
			// Focus the initial element if provided, otherwise focus the first focusable element
			if (initialFocusRef?.current) {
				initialFocusRef.current.focus()
			} else if (containerRef.current) {
				const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				)
				if (focusableElements.length > 0) {
					focusableElements[0].focus()
				}
			}
		}
	}, [active, initialFocusRef])

	// Return focus to the previous element when the trap becomes inactive
	useEffect(() => {
		if (!active && previousFocusRef.current) {
			if (returnFocusRef?.current) {
				returnFocusRef.current.focus()
			} else {
				previousFocusRef.current.focus()
			}
		}
	}, [active, returnFocusRef])

	// Handle tab key to trap focus
	useEffect(() => {
		if (!active || !containerRef.current) return

		const handleKeyDown = (event: KeyboardEvent) => {
			// Handle escape key
			if (event.key === 'Escape' && onEscape) {
				onEscape()
				event.preventDefault()
				return
			}

			// Only handle tab key
			if (event.key !== 'Tab') return

			const container = containerRef.current
			if (!container) return

			// Get all focusable elements
			const focusableElements = Array.from(
				container.querySelectorAll<HTMLElement>(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				),
			).filter((el) => !el.hasAttribute('disabled'))

			if (focusableElements.length === 0) return

			// Get first and last focusable elements
			const firstElement = focusableElements[0]
			const lastElement = focusableElements[focusableElements.length - 1]

			// If shift+tab on first element, move to last element
			if (event.shiftKey && document.activeElement === firstElement) {
				lastElement.focus()
				event.preventDefault()
			}
			// If tab on last element, move to first element
			else if (!event.shiftKey && document.activeElement === lastElement) {
				firstElement.focus()
				event.preventDefault()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [active, onEscape])

	return <div ref={containerRef}>{children}</div>
}

export default FocusTrap
