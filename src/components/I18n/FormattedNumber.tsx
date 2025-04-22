import React from 'react'

import { useI18n } from '../../contexts/I18nContext'

interface FormattedNumberProps {
	value: number
	style?: 'decimal' | 'currency' | 'percent' | 'unit'
	currency?: string
	currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol'
	unit?: string
	unitDisplay?: 'long' | 'short' | 'narrow'
	notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
	compactDisplay?: 'short' | 'long'
	minimumIntegerDigits?: number
	minimumFractionDigits?: number
	maximumFractionDigits?: number
	minimumSignificantDigits?: number
	maximumSignificantDigits?: number
	useGrouping?: boolean
	signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never'
}

/**
 * A component that formats numbers according to the current locale.
 */
export const FormattedNumber: React.FC<FormattedNumberProps> = ({
	value,
	style = 'decimal',
	currency,
	currencyDisplay,
	unit,
	unitDisplay,
	notation,
	compactDisplay,
	minimumIntegerDigits,
	minimumFractionDigits,
	maximumFractionDigits,
	minimumSignificantDigits,
	maximumSignificantDigits,
	useGrouping = true,
	signDisplay,
}) => {
	const { language } = useI18n()

	// Format options
	const options: Intl.NumberFormatOptions = {
		style,
		notation,
		compactDisplay,
		minimumIntegerDigits,
		minimumFractionDigits,
		maximumFractionDigits,
		minimumSignificantDigits,
		maximumSignificantDigits,
		useGrouping,
		signDisplay,
	}

	// Add style-specific options
	if (style === 'currency' && currency) {
		options.currency = currency
		options.currencyDisplay = currencyDisplay
	} else if (style === 'unit' && unit) {
		options.unit = unit
		options.unitDisplay = unitDisplay
	}

	// Format number
	const formattedNumber = new Intl.NumberFormat(language, options).format(value)

	return <>{formattedNumber}</>
}

export default FormattedNumber
