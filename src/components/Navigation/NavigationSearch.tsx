import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material'
import { IconButton, InputBase, Paper, useTheme } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

interface NavigationSearchProps {
	value: string
	onChange: (value: string) => void
}

const NavigationSearch = ({ value, onChange }: NavigationSearchProps) => {
	const theme = useTheme()
	const [inputValue, setInputValue] = useState(value)
	const inputRef = useRef<HTMLInputElement>(null)
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

	// Update local state when prop changes
	useEffect(() => {
		setInputValue(value)
	}, [value])

	// Debounce search input
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setInputValue(newValue)

		// Clear previous timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current)
		}

		// Set new timer
		debounceTimerRef.current = setTimeout(() => {
			onChange(newValue)
		}, 250) // 250ms debounce
	}

	// Clear search
	const handleClear = () => {
		setInputValue('')
		onChange('')
		inputRef.current?.focus()
	}

	// Clean up timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current)
			}
		}
	}, [])

	return (
		<Paper
			elevation={0}
			sx={{
				p: '2px 4px',
				display: 'flex',
				alignItems: 'center',
				m: 2,
				borderRadius: 2,
				backgroundColor:
					theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
				border: `1px solid ${theme.palette.divider}`,
				'&:hover': {
					backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[200],
				},
				'&:focus-within': {
					borderColor: theme.palette.primary.main,
					boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
				},
			}}>
			<IconButton sx={{ p: '10px' }} aria-label="search">
				<SearchIcon />
			</IconButton>
			<InputBase
				sx={{ ml: 1, flex: 1 }}
				placeholder="Search navigation..."
				inputProps={{ 'aria-label': 'search navigation' }}
				value={inputValue}
				onChange={handleInputChange}
				inputRef={inputRef}
			/>
			{inputValue && (
				<IconButton sx={{ p: '10px' }} aria-label="clear search" onClick={handleClear}>
					<ClearIcon />
				</IconButton>
			)}
		</Paper>
	)
}

export default NavigationSearch
