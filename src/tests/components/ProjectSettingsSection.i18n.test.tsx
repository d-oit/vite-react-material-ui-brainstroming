import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import ProjectSettingsSection from '../../components/Project/ProjectSettingsSection'
import { I18nProvider } from '../../contexts/I18nContext'
import { NodeType } from '../../types/enums'
import { ProjectTemplate } from '../../types/project'

// Mock the ErrorNotificationContext
vi.mock('../../contexts/ErrorNotificationContext', () => ({
	useErrorNotification: () => ({
		showError: vi.fn(),
	}),
}))

// Mock the loggerService
vi.mock('../../services/LoggerService', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
	},
}))

// Mock the s3Service
vi.mock('../../lib/s3Service', () => ({
	uploadProject: vi.fn().mockResolvedValue({}),
	downloadProject: vi.fn().mockResolvedValue({
		id: 'test-project-id',
		name: 'Test Project from S3',
		description: 'Test Description from S3',
		nodes: [],
		edges: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		version: '1',
	}),
}))

describe('ProjectSettingsSection i18n', () => {
	const mockProject = {
		id: 'test-project-id',
		name: 'Test Project',
		description: 'Test Description',
		nodes: [
			{
				id: 'node-1',
				type: NodeType.IDEA,
				position: { x: 100, y: 100 },
				data: {
					id: 'node-1',
					title: 'Test Node',
					label: 'Test Node',
					content: 'Test Content',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			},
		],
		edges: [
			{
				id: 'edge-1',
				source: 'node-1',
				target: 'node-2',
			},
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		version: '1',
		template: ProjectTemplate.CUSTOM,
		syncSettings: {
			enableS3Sync: true,
			syncFrequency: 'interval' as 'interval' | 'onSave' | 'manual',
			autoSave: false,
			intervalMinutes: 30,
		},
	}

	const mockSave = vi.fn()

	const renderComponent = (locale = 'en') => {
		render(
			<I18nProvider initialLocale={locale}>
				<ProjectSettingsSection project={mockProject} onSave={mockSave} />
			</I18nProvider>,
		)
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders with English translations by default', () => {
		renderComponent()

		// Check S3 section translations
		expect(screen.getByText('S3 Synchronization')).toBeInTheDocument()
		expect(screen.getByText('Enable S3 Synchronization')).toBeInTheDocument()
		expect(screen.getAllByText('Sync Frequency')[0]).toBeInTheDocument()
		expect(screen.getByLabelText('Interval (minutes)')).toBeInTheDocument()
		expect(screen.getByText('Sync Now')).toBeInTheDocument()

		// Check Import/Export section translations
		expect(screen.getByText('Import/Export')).toBeInTheDocument()
		expect(screen.getByText('Local File')).toBeInTheDocument()
		expect(screen.getByText('S3 Storage')).toBeInTheDocument()
		expect(screen.getByText('Export to File')).toBeInTheDocument()
		expect(screen.getByText('Import from File')).toBeInTheDocument()
		expect(screen.getByText('Export to S3')).toBeInTheDocument()
		expect(screen.getByText('Import from S3')).toBeInTheDocument()
	})

	it('renders with German translations', () => {
		renderComponent('de')

		// Check S3 section translations
		expect(screen.getByText('S3 Synchronisation')).toBeInTheDocument()
		expect(screen.getByText('S3-Synchronisation aktivieren')).toBeInTheDocument()
		expect(screen.getAllByText('Synchronisationshäufigkeit')[0]).toBeInTheDocument()
		expect(screen.getByLabelText('Intervall (Minuten)')).toBeInTheDocument()
		expect(screen.getByText('Jetzt synchronisieren')).toBeInTheDocument()

		// Check Import/Export section translations
		expect(screen.getByText('Import/Export')).toBeInTheDocument()
		expect(screen.getByText('Lokale Datei')).toBeInTheDocument()
		expect(screen.getByText('S3 Speicher')).toBeInTheDocument()
		expect(screen.getByText('In Datei exportieren')).toBeInTheDocument()
		expect(screen.getByText('Aus Datei importieren')).toBeInTheDocument()
		expect(screen.getByText('Nach S3 exportieren')).toBeInTheDocument()
		expect(screen.getByText('Von S3 importieren')).toBeInTheDocument()
	})

	it('renders with French translations', () => {
		renderComponent('fr')

		// Check S3 section translations
		expect(screen.getByText('Synchronisation S3')).toBeInTheDocument()
		expect(screen.getByText('Activer la synchronisation S3')).toBeInTheDocument()
		expect(screen.getAllByText('Fréquence de synchronisation')[0]).toBeInTheDocument()
		expect(screen.getByLabelText('Intervalle (minutes)')).toBeInTheDocument()
		expect(screen.getByText('Synchroniser maintenant')).toBeInTheDocument()

		// Check Import/Export section translations
		expect(screen.getByText('Import/Export')).toBeInTheDocument()
		expect(screen.getByText('Fichier Local')).toBeInTheDocument()
		expect(screen.getByText('Stockage S3')).toBeInTheDocument()
		expect(screen.getByText('Exporter vers un fichier')).toBeInTheDocument()
		expect(screen.getByText('Importer depuis un fichier')).toBeInTheDocument()
		expect(screen.getByText('Exporter vers S3')).toBeInTheDocument()
		expect(screen.getByText('Importer depuis S3')).toBeInTheDocument()
	})

	it('renders with Spanish translations', () => {
		renderComponent('es')

		// Check S3 section translations
		expect(screen.getByText('Sincronización S3')).toBeInTheDocument()
		expect(screen.getByText('Habilitar sincronización S3')).toBeInTheDocument()
		expect(screen.getAllByText('Frecuencia de sincronización')[0]).toBeInTheDocument()
		expect(screen.getByLabelText('Intervalo (minutos)')).toBeInTheDocument()
		expect(screen.getByText('Sincronizar ahora')).toBeInTheDocument()

		// Check Import/Export section translations
		expect(screen.getByText('Importar/Exportar')).toBeInTheDocument()
		expect(screen.getByText('Archivo Local')).toBeInTheDocument()
		expect(screen.getByText('Almacenamiento S3')).toBeInTheDocument()
		expect(screen.getByText('Exportar a archivo')).toBeInTheDocument()
		expect(screen.getByText('Importar desde archivo')).toBeInTheDocument()
		expect(screen.getByText('Exportar a S3')).toBeInTheDocument()
		expect(screen.getByText('Importar desde S3')).toBeInTheDocument()
	})
})
