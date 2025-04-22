import { Alert, Snackbar, Button, Typography, Box } from '@mui/material'
import type { ReactNode } from 'react'
import React, { createContext, useContext, useState, useCallback } from 'react'

import loggerService from '../services/LoggerService'

import { useI18n } from './I18nContext'

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface ErrorDetails {
	message: string
	severity?: ErrorSeverity
	error?: Error | unknown
	context?: Record<string, unknown>
	actionLabel?: string
	action?: () => void
	autoHideDuration?: number | null // null means don't auto-hide
}

interface ErrorNotificationContextType {
	showError: (messageOrDetails: string | ErrorDetails) => void
	clearError: () => void
	error: ErrorDetails | null
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined)

interface ErrorNotificationProviderProps {
	children: ReactNode
}

export const ErrorNotificationProvider: React.FC<ErrorNotificationProviderProps> = ({ children }) => {
	const [error, setError] = useState<ErrorDetails | null>(null)
	const [open, setOpen] = useState(false)
	const { t } = useI18n()

	const showError = useCallback((messageOrDetails: string | ErrorDetails) => {
		// Convert string message to ErrorDetails object
		const details: ErrorDetails =
			typeof messageOrDetails === 'string'
				? { message: messageOrDetails, severity: 'error' }
				: { ...messageOrDetails, severity: messageOrDetails.severity || 'error' }

		// Log the error
		if (details.severity === 'error') {
			loggerService.error(details.message, {
				error: details.error,
				...details.context,
			})
		} else if (details.severity === 'warning') {
			loggerService.warn(details.message, details.context)
		} else {
			loggerService.info(details.message, details.context)
		}

		setError(details)
		setOpen(true)
	}, [])

	const clearError = useCallback(() => {
		setError(null)
		setOpen(false)
	}, [])

	const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return
		}
		setOpen(false)
	}, [])

	const handleAction = useCallback(() => {
		if (error?.action) {
			error.action()
		}
		setOpen(false)
	}, [error])

	return (
		<ErrorNotificationContext.Provider value={{ showError, clearError, error }}>
			{children}
			<Snackbar
				open={open}
				autoHideDuration={error?.autoHideDuration === null ? null : error?.autoHideDuration || 6000}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert
					onClose={handleClose}
					severity={error?.severity || 'error'}
					sx={{ width: '100%' }}
					action={
						error?.action ? (
							<Button color="inherit" size="small" onClick={handleAction}>
								{error.actionLabel || t('common.retry')}
							</Button>
						) : undefined
					}>
					<Box>
						<Typography variant="body1">{error?.message || t('common.error')}</Typography>
						{error?.error instanceof Error && error.error.message && (
							<Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
								{error.error.message}
							</Typography>
						)}
					</Box>
				</Alert>
			</Snackbar>
		</ErrorNotificationContext.Provider>
	)
}

export const useErrorNotification = (): ErrorNotificationContextType => {
	const context = useContext(ErrorNotificationContext)

	if (context === undefined) {
		throw new Error('useErrorNotification must be used within an ErrorNotificationProvider')
	}

	return context
}
