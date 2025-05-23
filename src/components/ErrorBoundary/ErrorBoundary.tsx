import { Refresh as RefreshIcon, Home as HomeIcon, BugReport as BugIcon } from '@mui/icons-material'
import { Box, Typography, Button, Paper, Divider, Container } from '@mui/material'
import type { ErrorInfo, ReactNode } from 'react'
import React, { Component } from 'react'

import indexedDBService from '../../services/IndexedDBService'

interface Props {
	children: ReactNode
	fallback?: ReactNode
	onReset?: () => void
}

interface State {
	hasError: boolean
	error: Error | null
	errorInfo: ErrorInfo | null
}

/**
 * Error boundary component to catch and handle errors in the component tree
 */
class ErrorBoundaryClass extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		}
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return {
			hasError: true,
			error,
			errorInfo: null,
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log the error to our logging service
		this.logError(error, errorInfo)

		this.setState({
			error,
			errorInfo,
		})
	}

	/**
	 * Log the error to our logging service
	 */
	logError(error: Error, errorInfo: ErrorInfo): void {
		// Log to console
		console.error('Error caught by ErrorBoundary:', error, errorInfo)

		// Log to IndexedDB if available
		try {
			void indexedDBService.log('error', error.message, {
				stack: error.stack,
				componentStack: errorInfo.componentStack,
				timestamp: new Date().toISOString(),
			})
		} catch (loggingError) {
			console.error('Failed to log error to IndexedDB:', loggingError)
		}
	}

	/**
	 * Reset the error state and retry
	 */
	handleReset = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		})

		if (this.props.onReset) {
			this.props.onReset()
		}
	}

	/**
	 * Navigate to home page
	 */
	handleGoHome = (): void => {
		window.location.href = '/'
	}

	render(): ReactNode {
		if (this.state.hasError) {
			// If a custom fallback is provided, use it
			if (this.props.fallback !== undefined && this.props.fallback !== null) {
				return this.props.fallback
			}

			// Otherwise, use the default error UI
			return (
				<Container maxWidth="md" sx={{ py: 4 }}>
					<Paper
						elevation={3}
						sx={{
							p: 4,
							borderRadius: 2,
							textAlign: 'center',
						}}>
						<Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
							<BugIcon color="error" sx={{ fontSize: 64 }} />
						</Box>

						<Typography variant="h4" gutterBottom>
							Something went wrong
						</Typography>

						<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
							We&apos;re sorry, but an error occurred while rendering this page.
						</Typography>

						<Divider sx={{ my: 3 }} />

						<Box sx={{ mb: 3 }}>
							<Typography variant="subtitle2" color="error" align="left">
								Error:{' '}
								{this.state.error?.message !== undefined &&
								this.state.error?.message !== null &&
								this.state.error?.message !== ''
									? this.state.error.message
									: 'Unknown error'}
							</Typography>

							{this.state.errorInfo !== undefined && this.state.errorInfo !== null && (
								<Box
									component="pre"
									sx={{
										mt: 2,
										p: 2,
										bgcolor: 'background.default',
										borderRadius: 1,
										overflow: 'auto',
										fontSize: '0.75rem',
										textAlign: 'left',
										maxHeight: '200px',
									}}>
									{this.state.errorInfo.componentStack}
								</Box>
							)}
						</Box>

						<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
							<Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
								Go to Home
							</Button>

							<Button
								variant="contained"
								color="primary"
								startIcon={<RefreshIcon />}
								onClick={this.handleReset}>
								Try Again
							</Button>
						</Box>
					</Paper>
				</Container>
			)
		}

		// If there's no error, render children normally
		return this.props.children
	}
}

/**
 * Wrapper component to provide theme to the error boundary
 */
export const ErrorBoundary: React.FC<Props> = (props) => {
	return <ErrorBoundaryClass {...props} />
}

export default ErrorBoundary
