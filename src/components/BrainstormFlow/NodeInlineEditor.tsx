import { Box, TextField, ClickAwayListener, useTheme } from '@mui/material'
import React, { useState, useEffect, useRef } from 'react'

interface NodeInlineEditorProps {
	initialText: string
	onSave: (text: string) => void
	onCancel: () => void
	nodeId: string
}

/**
 * NodeInlineEditor component for direct text editing on nodes
 * Allows users to edit node text content directly on the canvas
 * without opening a dialog
 */
export const NodeInlineEditor: React.FC<NodeInlineEditorProps> = ({ initialText, onSave, onCancel, nodeId }) => {
	const [text, setText] = useState(initialText)
	const inputRef = useRef<HTMLInputElement>(null)
	const theme = useTheme()

	// Focus the input when the component mounts
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}

		// Announce to screen readers that editing has started
		const announceMessage = `Editing ${initialText.substring(0, 20)}${initialText.length > 20 ? '...' : ''}`
		const announcer = document.getElementById('screen-reader-announcer')
		if (announcer) {
			announcer.textContent = announceMessage
		}
	}, [initialText])

	const handleSave = () => {
		onSave(text)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSave()
		} else if (e.key === 'Escape') {
			onCancel()
		}
	}

	return (
		<ClickAwayListener onClickAway={handleSave}>
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 10,
					padding: 1,
					backgroundColor: theme.palette.background.paper,
					borderRadius: 1,
					boxShadow: theme.shadows[3],
				}}
				data-testid={`inline-editor-${nodeId}`}>
				<TextField
					inputRef={inputRef}
					fullWidth
					multiline
					variant="outlined"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					size="small"
					sx={{
						'& .MuiOutlinedInput-root': {
							padding: '8px',
						},
					}}
				/>
			</Box>
		</ClickAwayListener>
	)
}

export default NodeInlineEditor
