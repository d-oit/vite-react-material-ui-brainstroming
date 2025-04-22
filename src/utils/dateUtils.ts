/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
	dateString: string,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	},
): string => {
	const date = new Date(dateString)
	return new Intl.DateTimeFormat('en-US', options).format(date)
}

/**
 * Format a date string to a relative time format (e.g., "2 days ago")
 * @param dateString ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
	const date = new Date(dateString)
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	if (diffInSeconds < 60) {
		return 'just now'
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60)
	if (diffInMinutes < 60) {
		return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
	}

	const diffInHours = Math.floor(diffInMinutes / 60)
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
	}

	const diffInDays = Math.floor(diffInHours / 24)
	if (diffInDays < 30) {
		return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
	}

	const diffInMonths = Math.floor(diffInDays / 30)
	if (diffInMonths < 12) {
		return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
	}

	const diffInYears = Math.floor(diffInMonths / 12)
	return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
}

/**
 * Check if a date is today
 * @param dateString ISO date string
 * @returns Boolean indicating if the date is today
 */
export const isToday = (dateString: string): boolean => {
	const date = new Date(dateString)
	const today = new Date()
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	)
}

/**
 * Check if a date is yesterday
 * @param dateString ISO date string
 * @returns Boolean indicating if the date is yesterday
 */
export const isYesterday = (dateString: string): boolean => {
	const date = new Date(dateString)
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	return (
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear()
	)
}

/**
 * Format a date with smart formatting (today, yesterday, or regular date)
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatSmartDate = (dateString: string): string => {
	if (isToday(dateString)) {
		return 'Today'
	}
	if (isYesterday(dateString)) {
		return 'Yesterday'
	}
	return formatDate(dateString)
}
