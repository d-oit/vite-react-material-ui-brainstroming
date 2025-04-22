import {
	FileDownload as DownloadIcon,
	FileUpload as UploadIcon,
	WifiOff as OfflineIcon,
	// Info as InfoIcon, // Unused
	// Warning as WarningIcon, // Unused
} from '@mui/icons-material'
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Divider,
	Alert,
	Snackbar,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	CircularProgress,
	Chip,
	Tooltip,
} from '@mui/material'
import { useState, useRef, useEffect } from 'react'

import { useI18n } from '../../contexts/I18nContext'
import { useSettings } from '../../contexts/SettingsContext'
import loggerService from '../../services/LoggerService'
import offlineService from '../../services/OfflineService'

export const SettingsExportImport = () => {
	const { exportSettings, importSettings } = useSettings()
	const { t } = useI18n()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus())

	const [snackbar, setSnackbar] = useState<{
		open: boolean
		message: string
		severity: 'success' | 'error' | 'info' | 'warning'
	}>({
		open: false,
		message: '',
		severity: 'info',
	})

	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean
		title: string
		message: string
		onConfirm: () => void
	}>({
		open: false,
		title: '',
		message: '',
		onConfirm: () => {},
	})

	const [loading, setLoading] = useState(false)
	const [validationResult, setValidationResult] = useState<{
		isValid: boolean
		warnings: string[]
		errors: string[]
	} | null>(null)

	// Monitor online status
	useEffect(() => {
		const removeStatusListener = offlineService.addOnlineStatusListener((online) => {
			setIsOnline(online)
		})

		return () => {
			removeStatusListener()
		}
	}, [])

	const handleExport = async () => {
		try {
			setLoading(true)
			const settingsJson = await exportSettings()

			// Create a blob and download it
			const blob = new Blob([settingsJson], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `d.o.it.brainstorming-settings-${new Date().toISOString().split('T')[0]}.json`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)

			setSnackbar({
				open: true,
				message: t('importExport.exportSuccess'),
				severity: 'success',
			})

			// Log the export
			void loggerService.info('Settings exported successfully')
		} catch (error) {
			console.error('Failed to export settings:', error)
			void loggerService.error(
				'Failed to export settings',
				error instanceof Error ? error : new Error(String(error)),
			)

			setSnackbar({
				open: true,
				message:
					t('importExport.exportError') + ' ' + (error instanceof Error ? error.message : 'Unknown error'),
				severity: 'error',
			})
		} finally {
			setLoading(false)
		}
	}

	const handleImportClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (e) => {
			const content = e.target?.result as string

			// Show confirmation dialog
			setConfirmDialog({
				open: true,
				title: t('importExport.importConfirmTitle'),
				message: t('importExport.importConfirmMessage'),
				onConfirm: () => processImport(content),
			})
		}

		reader.readAsText(file)

		// Reset the input so the same file can be selected again
		event.target.value = ''
	}

	// Validate settings JSON before import
	const validateSettingsJson = (
		content: string,
	): {
		isValid: boolean
		warnings: string[]
		errors: string[]
	} => {
		const warnings: string[] = []
		const errors: string[] = []
		let isValid = true

		try {
			// Try to parse the JSON
			const data = JSON.parse(content)

			// Check if it's a valid settings object
			if (!data) {
				errors.push('Empty data')
				isValid = false
			}

			// Check for required fields in settings format
			if (isValid) {
				// If it's the new format with metadata
				if (data.metadata) {
					if (!data.settings) {
						errors.push('Missing settings data')
						isValid = false
					}

					// Check version compatibility
					if (data.metadata.version && data.metadata.version !== '1.0.0') {
						warnings.push(`Settings version mismatch: ${data.metadata.version}`)
					}
				}
				// If it's a direct settings object (legacy format)
				else if (!data.themeMode) {
					warnings.push('Legacy format detected, some settings may not be imported correctly')
				}
			}

			return { isValid, warnings, errors }
		} catch (_) {
			errors.push('Invalid JSON format')
			return { isValid: false, warnings, errors }
		}
	}

	const processImport = async (content: string) => {
		try {
			setLoading(true)

			// Validate the settings JSON
			const validation = validateSettingsJson(content)
			setValidationResult(validation)

			if (!validation.isValid) {
				setSnackbar({
					open: true,
					message: `${t('importExport.exportError')} ${validation.errors.join(', ')}`,
					severity: 'error',
				})
				return
			}

			// If there are warnings, log them
			if (validation.warnings.length > 0) {
				loggerService.warn(`Settings import warnings: ${validation.warnings.join(', ')}`)
			}

			const success = await importSettings(content)

			if (success) {
				setSnackbar({
					open: true,
					message:
						validation.warnings.length > 0
							? t('importExport.importWarning')
							: t('importExport.importSuccess'),
					severity: validation.warnings.length > 0 ? 'warning' : 'success',
				})
				loggerService.info('Settings imported successfully')
			} else {
				setSnackbar({
					open: true,
					message: t('importExport.importError'),
					severity: 'error',
				})
				loggerService.error('Failed to import settings: Invalid format')
			}
		} catch (error) {
			console.error('Failed to import settings:', error)
			loggerService.error('Failed to import settings', error instanceof Error ? error : new Error(String(error)))

			setSnackbar({
				open: true,
				message:
					t('importExport.exportError') + ' ' + (error instanceof Error ? error.message : 'Unknown error'),
				severity: 'error',
			})
		} finally {
			setLoading(false)
			setConfirmDialog({ ...confirmDialog, open: false })
		}
	}

	return (
		<Box sx={{ p: { xs: 0, sm: 1 } }}>
			<Typography variant="h6" gutterBottom>
				{t('importExport.exportImportSettings')}
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				{t('importExport.exportSettingsDescription')}
			</Typography>

			{!isOnline && (
				<Tooltip title={t('importExport.offlineTooltip')}>
					<Chip
						icon={<OfflineIcon />}
						label={t('importExport.offline')}
						color="warning"
						size="small"
						sx={{ ml: 2 }}
					/>
				</Tooltip>
			)}

			<Divider sx={{ mb: 3 }} />

			{validationResult && validationResult.warnings.length > 0 && (
				<Alert severity="warning" sx={{ mb: 3 }}>
					<Typography variant="body2">
						<strong>{t('importExport.warning')}</strong> {validationResult.warnings.join(', ')}
					</Typography>
				</Alert>
			)}

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography variant="subtitle1" gutterBottom>
						{t('importExport.exportSettings')}
					</Typography>
					<Typography variant="body2" color="text.secondary" paragraph>
						{t('importExport.exportSettingsDetail')}
					</Typography>
					<Button
						variant="contained"
						startIcon={<DownloadIcon />}
						onClick={handleExport}
						disabled={loading}
						aria-label="Export settings to JSON file">
						{loading ? <CircularProgress size={24} /> : t('importExport.exportSettings')}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="subtitle1" gutterBottom>
						{t('importExport.importSettings')}
					</Typography>
					<Typography variant="body2" color="text.secondary" paragraph>
						{t('importExport.importSettingsDetail')}
					</Typography>
					<Button
						variant="outlined"
						startIcon={<UploadIcon />}
						onClick={handleImportClick}
						disabled={loading}
						aria-label="Import settings from JSON file">
						{loading ? <CircularProgress size={24} /> : t('importExport.importSettings')}
					</Button>
					<input
						type="file"
						ref={fileInputRef}
						className="visually-hidden"
						accept=".json"
						onChange={handleFileSelected}
						aria-label="File input for importing settings"
						title="Select a settings JSON file to import"
					/>
				</CardContent>
			</Card>

			{/* Confirmation Dialog */}
			<Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
				<DialogTitle>{confirmDialog.title}</DialogTitle>
				<DialogContent>
					<DialogContentText>{confirmDialog.message}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
						{t('importExport.cancel')}
					</Button>
					<Button onClick={confirmDialog.onConfirm} variant="contained" color="primary">
						{t('importExport.confirm')}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}>
				<Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	)
}
