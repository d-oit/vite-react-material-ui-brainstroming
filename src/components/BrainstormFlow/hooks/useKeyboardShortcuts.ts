import { useEffect, useCallback } from 'react'

interface KeyboardShortcutHandlers {
	onAutoLayout?: () => void
	onZoomIn?: () => void
	onZoomOut?: () => void
	onFitView?: () => void
	onToggleFullscreen?: () => void
}

export function useKeyboardShortcuts({
	onAutoLayout,
	onZoomIn,
	onZoomOut,
	onFitView,
	onToggleFullscreen,
}: KeyboardShortcutHandlers) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return
			}

			const ctrlKey = event.ctrlKey || event.metaKey // metaKey for Mac

			if (ctrlKey && event.key.toLowerCase() === 'l') {
				event.preventDefault()
				onAutoLayout?.()
			} else if (ctrlKey && event.key === '=') {
				event.preventDefault()
				onZoomIn?.()
			} else if (ctrlKey && event.key === '-') {
				event.preventDefault()
				onZoomOut?.()
			} else if (ctrlKey && event.key === '0') {
				event.preventDefault()
				onFitView?.()
			} else if (event.key.toLowerCase() === 'f') {
				event.preventDefault()
				onToggleFullscreen?.()
			}
		},
		[onAutoLayout, onZoomIn, onZoomOut, onFitView, onToggleFullscreen],
	)

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [handleKeyDown])
}
