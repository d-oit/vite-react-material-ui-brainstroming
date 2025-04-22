import React from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface FormattedDateProps {
	value: Date | string | number
	format?: 'short' | 'medium' | 'long' | 'full'
	year?: 'numeric' | '2-digit'
	month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long'
	day?: 'numeric' | '2-digit'
	weekday?: 'narrow' | 'short' | 'long'
	hour?: 'numeric' | '2-digit'
	minute?: 'numeric' | '2-digit'
	second?: 'numeric' | '2-digit'
	timeZoneName?: 'short' | 'long'
	hour12?: boolean
	dateStyle?: 'full' | 'long' | 'medium' | 'short'
	timeStyle?: 'full' | 'long' | 'medium' | 'short'
	timeZone?: string
	relative?: boolean
	tooltip?: boolean
}

/**
 * A component that formats dates and times according to the current locale.
 */
export const FormattedDate: React.FC<FormattedDateProps> = ({
	value,
	format = 'medium',
	year,
	month,
	day,
	weekday,
	hour,
	minute,
	second,
	timeZoneName,
	hour12,
	dateStyle,
	timeStyle,
	timeZone,
	relative = false,
	tooltip = true,
}) => {
	const { language } = useI18n()

	// Convert value to Date object
	const date = value instanceof Date ? value : new Date(value)

	// Check if date is valid
	if (isNaN(date.getTime())) {
		console.error('Invalid date provided to FormattedDate:', value)
		return <>Invalid Date</>
	}

	// Format options based on format prop
	const getFormatOptions = () => {
		if (dateStyle || timeStyle) {
			return {
				dateStyle,
				timeStyle,
				timeZone,
				hour12,
			}
		}

		switch (format) {
			case 'short':
				return {
					year: year || 'numeric',
					month: month || '2-digit',
					day: day || '2-digit',
					hour: hour || undefined,
					minute: minute || undefined,
					second: second || undefined,
					timeZoneName: timeZoneName || undefined,
					hour12: hour12 !== undefined ? hour12 : undefined,
					timeZone,
				}
			case 'medium':
				return {
					year: year || 'numeric',
					month: month || 'short',
					day: day || 'numeric',
					hour: hour || undefined,
					minute: minute || undefined,
					second: second || undefined,
					timeZoneName: timeZoneName || undefined,
					hour12: hour12 !== undefined ? hour12 : undefined,
					timeZone,
				}
			case 'long':
				return {
					year: year || 'numeric',
					month: month || 'long',
					day: day || 'numeric',
					weekday: weekday || 'long',
					hour: hour || undefined,
					minute: minute || undefined,
					second: second || undefined,
					timeZoneName: timeZoneName || undefined,
					hour12: hour12 !== undefined ? hour12 : undefined,
					timeZone,
				}
			case 'full':
				return {
					year: year || 'numeric',
					month: month || 'long',
					day: day || 'numeric',
					weekday: weekday || 'long',
					hour: hour || '2-digit',
					minute: minute || '2-digit',
					second: second || '2-digit',
					timeZoneName: timeZoneName || 'long',
					hour12: hour12 !== undefined ? hour12 : undefined,
					timeZone,
				}
			default:
				return {
					year,
					month,
					day,
					weekday,
					hour,
					minute,
					second,
					timeZoneName,
					hour12,
					timeZone,
				}
		}
	}

	// Format date
	const formattedDate = new Intl.DateTimeFormat(language, getFormatOptions() as Intl.DateTimeFormatOptions).format(
		date,
	)

	// Format relative time if requested
	const getRelativeTime = () => {
		const now = new Date()
		const diffMs = date.getTime() - now.getTime()
		const diffSec = Math.round(diffMs / 1000)
		const diffMin = Math.round(diffSec / 60)
		const diffHour = Math.round(diffMin / 60)
		const diffDay = Math.round(diffHour / 24)
		const diffMonth = Math.round(diffDay / 30)
		const diffYear = Math.round(diffDay / 365)

		const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })

		if (Math.abs(diffSec) < 60) {
			return rtf.format(diffSec, 'second')
		} else if (Math.abs(diffMin) < 60) {
			return rtf.format(diffMin, 'minute')
		} else if (Math.abs(diffHour) < 24) {
			return rtf.format(diffHour, 'hour')
		} else if (Math.abs(diffDay) < 30) {
			return rtf.format(diffDay, 'day')
		} else if (Math.abs(diffMonth) < 12) {
			return rtf.format(diffMonth, 'month')
		} else {
			return rtf.format(diffYear, 'year')
		}
	}

	const displayText = relative ? getRelativeTime() : formattedDate

	// Return with tooltip if requested
	if (tooltip && relative) {
		return <span title={formattedDate}>{displayText}</span>
	}

	return <>{displayText}</>
}

export default FormattedDate
