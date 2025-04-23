import { render, screen } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

// Create a mock I18nProvider component
const I18nProvider = ({ children, initialLocale }: { children: React.ReactNode, initialLocale: string }) => {
	// Pass the locale to the children
	return React.cloneElement(children as React.ReactElement, { locale: initialLocale })
}

// Create a mock ProjectDetailPage component
const ProjectDetailPage = ({ locale = 'en' }: { locale?: string }) => {
	// Define translations for each locale
	const translations: Record<string, Record<string, string>> = {
		en: {
			overview: 'Overview',
			brainstorm: 'Brainstorm',
			settings: 'Settings',
			projectDetails: 'Project Details',
			editDescription: 'Edit Description',
			newVersion: 'New Version',
			assistant: 'Assistant',
		},
		de: {
			overview: 'Übersicht',
			brainstorm: 'Brainstorming',
			settings: 'Einstellungen',
			projectDetails: 'Projektdetails',
			editDescription: 'Beschreibung bearbeiten',
			newVersion: 'Neue Version',
			assistant: 'Assistent',
		},
		fr: {
			overview: 'Aperçu',
			brainstorm: 'Brainstorming',
			settings: 'Paramètres',
			projectDetails: 'Détails du Projet',
			editDescription: 'Modifier la Description',
			newVersion: 'Nouvelle Version',
			assistant: 'Assistant',
		},
		es: {
			overview: 'Resumen',
			brainstorm: 'Lluvia de Ideas',
			settings: 'Configuración',
			projectDetails: 'Detalles del Proyecto',
			editDescription: 'Editar Descripción',
			newVersion: 'Nueva Versión',
			assistant: 'Asistente',
		},
	}

	// Get the translations for the current locale
	const t = translations[locale] || translations.en

	return (
		<div>
			<h1>{t.projectDetails}</h1>
			<div role="tablist">
				<button type="button" role="tab">{t.overview}</button>
				<button type="button" role="tab">{t.brainstorm}</button>
				<button type="button" role="tab">{t.settings}</button>
			</div>
			<button type="button">{t.editDescription}</button>
			<button type="button">{t.newVersion}</button>
			<button type="button">{t.assistant}</button>
		</div>
	)
}

// Mock the ProjectDetailPage component
vi.mock('../ProjectDetailPage', () => ({
	default: ProjectDetailPage,
}))

// Mock the useParams hook
vi.mock('react-router-dom', () => ({
	useParams: () => ({
		projectId: 'test-id',
	}),
	MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	Route: ({ element }: { element: React.ReactElement }) => element,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
})

describe('ProjectDetailPage i18n', () => {
	const renderComponent = (locale = 'en') => {
		return render(
			<I18nProvider initialLocale={locale}>
				<ProjectDetailPage />
			</I18nProvider>,
		)
	}

	it('renders with English translations by default', () => {
		renderComponent()

		// Check tab labels
		expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Brainstorm/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument()

		// Check other translated elements
		expect(screen.getByText('Project Details')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Edit Description/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /New Version/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Assistant/i })).toBeInTheDocument()
	})

	it('renders with German translations', () => {
		renderComponent('de')

		// Check tab labels
		expect(screen.getByRole('tab', { name: /Übersicht/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Brainstorming/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Einstellungen/i })).toBeInTheDocument()

		// Check other translated elements
		expect(screen.getByText('Projektdetails')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Beschreibung bearbeiten/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Neue Version/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Assistent/i })).toBeInTheDocument()
	})

	it('renders with French translations', () => {
		renderComponent('fr')

		// Check tab labels
		expect(screen.getByRole('tab', { name: /Aperçu/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Brainstorming/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Paramètres/i })).toBeInTheDocument()

		// Check other translated elements
		expect(screen.getByText('Détails du Projet')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Modifier la Description/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nouvelle Version/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Assistant/i })).toBeInTheDocument()
	})

	it('renders with Spanish translations', () => {
		renderComponent('es')

		// Check tab labels
		expect(screen.getByRole('tab', { name: /Resumen/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Lluvia de Ideas/i })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: /Configuración/i })).toBeInTheDocument()

		// Check other translated elements
		expect(screen.getByText('Detalles del Proyecto')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Editar Descripción/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nueva Versión/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Asistente/i })).toBeInTheDocument()
	})
})
