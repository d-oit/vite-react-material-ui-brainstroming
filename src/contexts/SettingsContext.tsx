import type { ReactNode } from 'react'
import React, { createContext, useContext, useState, useEffect } from 'react'

import chatService from '../services/ChatService'
import type { ColorScheme, NodePreferences } from '../services/IndexedDBService'
import indexedDBService from '../services/IndexedDBService'
import s3Service from '../services/S3Service'
import { ThemeMode, NodeType } from '../types'

interface Settings {
	themeMode: ThemeMode
	language: string
	openRouterApiKey: string
	openRouterModel: string
	awsAccessKeyId: string
	awsSecretAccessKey: string
	awsRegion: string
	awsBucketName: string
	autoSave: boolean
	autoBackup: boolean
	fontSize: number
	skipDeleteConfirmation: boolean
	activeColorSchemeId: string
	preferredNodeSize: 'small' | 'medium' | 'large'
	accessibilityPreferences?: {
		reducedMotion?: boolean
	}
}

interface SettingsContextType {
	settings: Settings
	updateSettings: (newSettings: Partial<Settings>) => void
	resetSettings: () => void
	colorSchemes: ColorScheme[]
	activeColorScheme: ColorScheme | null
	nodePreferences: NodePreferences | null
	getNodeColor: (type: NodeType, customColor?: string) => string
	exportSettings: () => Promise<string>
	importSettings: (jsonData: string) => Promise<boolean>
	updateColorScheme: (colorScheme: ColorScheme) => Promise<void>
	createColorScheme: (name: string, colors: Record<NodeType, string>) => Promise<ColorScheme>
	deleteColorScheme: (id: string) => Promise<void>
	updateNodePreferences: (preferences: Partial<NodePreferences>) => Promise<void>
}

const defaultSettings: Settings = {
	themeMode: ThemeMode.SYSTEM,
	language: 'en',
	openRouterApiKey: '',
	openRouterModel: 'anthropic/claude-3-opus',
	awsAccessKeyId: '',
	awsSecretAccessKey: '',
	awsRegion: 'us-east-1',
	awsBucketName: 'do-it-brainstorming',
	autoSave: true,
	autoBackup: false,
	fontSize: 16,
	skipDeleteConfirmation: false,
	activeColorSchemeId: 'default',
	preferredNodeSize: 'medium',
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Define interface for imported data structure
interface ImportedSettingsData {
	settings: Settings // Assuming Settings type is defined elsewhere
	metadata?: object
	colorSchemes?: any[] // TODO: Define a proper type for color schemes
	nodePreferences?: NodePreferences // Use the imported NodePreferences type
}

// Type guard for NodePreferences
function isNodePreferences(data: any): data is NodePreferences {
	return (
		typeof data === 'object' &&
		data !== null &&
		// Add checks for required properties of NodePreferences
		Object.prototype.hasOwnProperty.call(data, 'defaultSize') &&
		Object.prototype.hasOwnProperty.call(data, 'defaultColorScheme') &&
		Object.prototype.hasOwnProperty.call(data, 'nodeSizes') &&
		typeof data.defaultSize === 'string' && // Assuming defaultSize is a string
		typeof data.defaultColorScheme === 'string' && // Assuming defaultColorScheme is a string
		typeof data.nodeSizes === 'object' && // Assuming nodeSizes is an object
		data.nodeSizes !== null
		// Add more specific checks for nodeSizes properties if needed
	)
}

// Type guard for ImportedSettingsData
function isImportedSettingsData(data: any): data is ImportedSettingsData {
	return (
		typeof data === 'object' &&
		data !== null &&
		// Check for settings property and its structure
		Object.prototype.hasOwnProperty.call(data, 'settings') &&
		typeof data.settings === 'object' &&
		data.settings !== null &&
		// Add checks for required properties of Settings if needed
		// For example: Object.prototype.hasOwnProperty.call(data.settings, 'themeMode') &&
		// Check for optional nodePreferences property and its structure if present
		(!Object.prototype.hasOwnProperty.call(data, 'nodePreferences') || isNodePreferences(data.nodePreferences))
		// Add checks for other optional properties like metadata and colorSchemes if needed
	)
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [settings, setSettings] = useState<Settings>(defaultSettings)
	const [colorSchemes, setColorSchemes] = useState<ColorScheme[]>([])
	const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme | null>(null)
	const [nodePreferences, setNodePreferences] = useState<NodePreferences | null>(null)

	// Initialize IndexedDB and load data
	useEffect(() => {
		// Function to fall back to localStorage when IndexedDB is not available
		const fallbackToLocalStorage = () => {
			const storedSettings = localStorage.getItem('app_settings')
			if (storedSettings) {
				try {
					const parsedSettings = JSON.parse(storedSettings)
					const mergedSettings = { ...defaultSettings, ...parsedSettings }
					setSettings(mergedSettings)
					configureServices(mergedSettings)
				} catch (error) {
					console.error('Error parsing settings from localStorage:', error)
					setSettings(defaultSettings)
					configureServices(defaultSettings)
				}
			} else {
				setSettings(defaultSettings)
				configureServices(defaultSettings)
			}
		}

		const initializeData = async () => {
			try {
				// Initialize IndexedDB
				const initialized = await indexedDBService.init()

				if (!initialized) {
					console.warn('IndexedDB not available, falling back to localStorage')
					fallbackToLocalStorage()
					return
				}

				// Load color schemes
				const schemes = await indexedDBService.getColorSchemes()
				setColorSchemes(schemes)

				// Load node preferences
				const prefs = await indexedDBService.getNodePreferences()
				setNodePreferences(prefs)

				// Load settings from IndexedDB or localStorage
				const dbSettings = await indexedDBService.getAllSettings()
				const storedSettings = localStorage.getItem('app_settings')

				if (Object.keys(dbSettings).length > 0) {
					// Use settings from IndexedDB
					const mergedSettings = { ...defaultSettings, ...dbSettings }
					setSettings(mergedSettings as Settings)
					configureServices(mergedSettings as Settings)

					// Migrate settings from localStorage to IndexedDB if needed
					if (storedSettings) {
						localStorage.removeItem('app_settings')
					}
				} else if (storedSettings) {
					// Use settings from localStorage and migrate to IndexedDB
					const parsedSettings = JSON.parse(storedSettings)
					setSettings(parsedSettings)
					await indexedDBService.saveSettings(parsedSettings)
					configureServices(parsedSettings)
					localStorage.removeItem('app_settings')
				}

				// Set active color scheme
				const activeSchemeId = settings.activeColorSchemeId || 'default'
				const activeScheme =
					schemes.find((scheme) => scheme.id === activeSchemeId) ||
					(await indexedDBService.getDefaultColorScheme())
				if (activeScheme) {
					setActiveColorScheme(activeScheme)
				}
			} catch (error) {
				console.error('Failed to initialize settings:', error)
				// Fallback to localStorage if IndexedDB fails
				fallbackToLocalStorage()
			}
		}

		void initializeData() // Add void operator to explicitly ignore the promise
	}, [settings.activeColorSchemeId])

	// Configure services with settings
	const configureServices = (settingsToUse: Settings) => {
		// Configure chat service
		if (settingsToUse.openRouterApiKey) {
			chatService.configure(settingsToUse.openRouterApiKey, settingsToUse.openRouterModel)
		}

		// Only configure S3 if it's available and credentials are provided
		if (s3Service.isS3Available() && settingsToUse.awsAccessKeyId && settingsToUse.awsSecretAccessKey) {
			s3Service
				.configure(
					settingsToUse.awsAccessKeyId,
					settingsToUse.awsSecretAccessKey,
					settingsToUse.awsRegion,
					settingsToUse.awsBucketName,
				)
				.catch((error) => {
					console.warn('Failed to configure S3 service:', error)
				})
		}
	}

	// Update settings
	const updateSettings = (newSettings: Partial<Settings>) => {
		setSettings((prevSettings) => {
			// Ensure themeMode is a valid enum value if it's being updated
			if (
				newSettings.themeMode !== undefined &&
				!Object.values(ThemeMode).includes(newSettings.themeMode as ThemeMode)
			) {
				// Default to system if invalid value
				newSettings.themeMode = ThemeMode.SYSTEM
			}

			const updatedSettings = { ...prevSettings, ...newSettings }

			// Save to IndexedDB
			indexedDBService.saveSettings((updatedSettings as unknown) as Record<string, unknown>).catch((error) => {
				console.error('Failed to save settings to IndexedDB:', error)
				// Fallback to localStorage
				localStorage.setItem('app_settings', JSON.stringify(updatedSettings))
			})

			// Configure services with new settings
			if (newSettings.openRouterApiKey || newSettings.openRouterModel) {
				chatService.configure(updatedSettings.openRouterApiKey, updatedSettings.openRouterModel)
			}

			// Only configure S3 if it's available and credentials are provided
			if (
				s3Service.isS3Available() &&
				(newSettings.awsAccessKeyId ||
					newSettings.awsSecretAccessKey ||
					newSettings.awsRegion ||
					newSettings.awsBucketName)
			) {
				if (updatedSettings.awsAccessKeyId && updatedSettings.awsSecretAccessKey) {
					s3Service
						.configure(
							updatedSettings.awsAccessKeyId,
							updatedSettings.awsSecretAccessKey,
							updatedSettings.awsRegion,
							updatedSettings.awsBucketName,
						)
						.catch((error) => {
							console.warn('Failed to configure S3 service:', error)
						})
				}
			}

			// Update active color scheme if changed
			if (
				newSettings.activeColorSchemeId &&
				newSettings.activeColorSchemeId !== prevSettings.activeColorSchemeId
			) {
				const newActiveScheme = colorSchemes.find((scheme) => scheme.id === newSettings.activeColorSchemeId)
				if (newActiveScheme) {
					setActiveColorScheme(newActiveScheme)
				}
			}

			return updatedSettings
		})
	}

	// Reset settings to defaults
	const resetSettings = () => {
		setSettings(defaultSettings)
		indexedDBService.saveSettings((defaultSettings as unknown) as Record<string, unknown>).catch((error) => {
			console.error('Failed to reset settings in IndexedDB:', error)
			localStorage.removeItem('app_settings')
		})
	}

	// Get node color based on type and active color scheme
	const getNodeColor = (type: NodeType, customColor?: string): string => {
		// If a custom color is provided for this specific node, use it
		if (customColor) return customColor

		// If node has a custom color in preferences, use it in a type-safe way
		if (nodePreferences?.customColors) {
			// Check each type explicitly to avoid object injection
			if (type === 'task' && nodePreferences.customColors.task) {
				return nodePreferences.customColors.task
			} else if (type === 'note' && nodePreferences.customColors.note) {
				return nodePreferences.customColors.note
			} else if (type === 'idea' && nodePreferences.customColors.idea) {
				return nodePreferences.customColors.idea
			}
			// Removed checks for non-existent types: decision, question, action
		}

		// If active color scheme has a color for this node type, use it in a type-safe way
		if (activeColorScheme) {
			// Check each type explicitly to avoid object injection
			if (type === 'task') {
				return activeColorScheme.colors.task || '#f5f5f5'
			} else if (type === 'note') {
				return activeColorScheme.colors.note || '#f5f5f5'
			} else if (type === 'idea') {
				return activeColorScheme.colors.idea || '#f5f5f5'
			}
			// Removed checks for non-existent types: decision, question, action
			return '#f5f5f5'
		}

		// Fallback colors if no active scheme
		switch (type) {
		case NodeType.IDEA:
			return '#e3f2fd' // Light blue
		case NodeType.TASK:
			return '#e8f5e9' // Light green
		case NodeType.NOTE:
			return '#fff8e1' // Light yellow
		case NodeType.RESOURCE:
			return '#f3e5f5' // Light purple
		default:
			return '#f5f5f5' // Light grey
		}
	}

	// Export settings to JSON
	const exportSettings = async (): Promise<string> => {
		try {
			const exportData = {
				settings,
				colorSchemes,
				nodePreferences,
				metadata: {
					exportDate: new Date().toISOString(),
					version: '1.0.0',
					appName: 'd.o.it.brainstorming',
				},
			}
			return JSON.stringify(exportData, null, 2)
		} catch (error) {
			console.error('Failed to export settings:', error)
			throw new Error('Failed to export settings')
		}
	}

	// Import settings from JSON
	const importSettings = async (jsonData: string): Promise<boolean> => {
		try {
			const importData = JSON.parse(jsonData)

			// Validate imported data using type guard
			if (!isImportedSettingsData(importData)) {
				// Try to handle legacy format
				try {
					const legacySettings = JSON.parse(jsonData) as Settings
					setSettings((prevSettings) => ({
						...prevSettings,
						...legacySettings,
					}))
					await indexedDBService.saveSettings((legacySettings as unknown) as Record<string, unknown>)
					return true
				} catch (_) {
					throw new Error('Invalid settings data')
				}
			}

			// Log metadata if available
			if (importData.metadata && typeof importData.metadata === 'object') { // Check type explicitly
				console.log('Importing settings from:', importData.metadata)
			}

			// Import settings
			setSettings((prevSettings) => ({
				...prevSettings,
				...importData.settings,
			}))
			await indexedDBService.saveSettings(importData.settings as unknown as Record<string, unknown>)

			// Import color schemes if available
			if (importData.colorSchemes && Array.isArray(importData.colorSchemes)) {
				for (const scheme of importData.colorSchemes) {
					// TODO: Add type validation for scheme
					await indexedDBService.saveColorScheme(scheme)
				}
				const updatedSchemes = await indexedDBService.getColorSchemes()
				setColorSchemes(updatedSchemes)
			}

			// Import node preferences if available
			if (importData.nodePreferences && isNodePreferences(importData.nodePreferences)) { // Use type guard
				await indexedDBService.saveNodePreferences(importData.nodePreferences)
				setNodePreferences(importData.nodePreferences)
			}

			// Set active color scheme
			if (importData.settings.activeColorSchemeId) { // Removed Boolean()
				const activeScheme =
					colorSchemes.find((scheme) => scheme.id === importData.settings.activeColorSchemeId) ||
					(await indexedDBService.getColorScheme(importData.settings.activeColorSchemeId))

				if (activeScheme) { // Removed Boolean()
					setActiveColorScheme(activeScheme)
				} // Added missing closing brace
			}

			// Configure services with imported settings
			configureServices(importData.settings)

			return true // Added return true for try block
		} catch (error) { // Added missing catch block
			console.error('Failed to import settings:', error)
			return false // Added return false for catch block
		}
	}

	// Update a color scheme
	const updateColorScheme = async (colorScheme: ColorScheme): Promise<void> => {
		try {
			await indexedDBService.saveColorScheme(colorScheme)

			// Update color schemes list
			const updatedSchemes = await indexedDBService.getColorSchemes()
			setColorSchemes(updatedSchemes)

			// Update active color scheme if it's the one being updated
			if (activeColorScheme && activeColorScheme.id === colorScheme.id) {
				setActiveColorScheme(colorScheme)
			}
		} catch (error) {
			console.error('Failed to update color scheme:', error)
			throw new Error('Failed to update color scheme')
		}
	}

	// Create a new color scheme
	const createColorScheme = async (name: string, colors: Record<NodeType, string>): Promise<ColorScheme> => {
		try {
			const newScheme: ColorScheme = {
				id: crypto.randomUUID(),
				name,
				colors,
				isDefault: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}

			await indexedDBService.saveColorScheme(newScheme)

			// Update color schemes list
			const updatedSchemes = await indexedDBService.getColorSchemes()
			setColorSchemes(updatedSchemes)

			return newScheme
		} catch (error) {
			console.error('Failed to create color scheme:', error)
			throw new Error('Failed to create color scheme')
		}
	}

	// Delete a color scheme
	const deleteColorScheme = async (id: string): Promise<void> => {
		try {
			// Don't allow deleting the active color scheme
			if (settings.activeColorSchemeId === id) {
				throw new Error('Cannot delete the active color scheme')
			}

			await indexedDBService.deleteColorScheme(id)

			// Update color schemes list
			const updatedSchemes = await indexedDBService.getColorSchemes()
			setColorSchemes(updatedSchemes)
		} catch (error) {
			console.error('Failed to delete color scheme:', error)
			throw new Error('Failed to delete color scheme')
		}
	}

	// Update node preferences
	const updateNodePreferences = async (preferences: Partial<NodePreferences>): Promise<void> => {
		try {
			const updatedPreferences = { ...nodePreferences, ...preferences } as NodePreferences
			await indexedDBService.saveNodePreferences(updatedPreferences)
			setNodePreferences(updatedPreferences)
		} catch (error) {
			console.error('Failed to update node preferences:', error)
			throw new Error('Failed to update node preferences')
		}
	}

	return (
		<SettingsContext.Provider
			value={{
				settings,
				updateSettings,
				resetSettings,
				colorSchemes,
				activeColorScheme,
				nodePreferences,
				getNodeColor,
				exportSettings,
				importSettings,
				updateColorScheme,
				createColorScheme,
				deleteColorScheme,
				updateNodePreferences,
			}}>
			{children}
		</SettingsContext.Provider>
	)
}

export const useSettings = (): SettingsContextType => {
	const context = useContext(SettingsContext)
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider')
	}
	return context
}
