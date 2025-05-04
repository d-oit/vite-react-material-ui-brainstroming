import { render } from '@testing-library/react'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import { createInstance } from 'i18next'
import type { i18n } from 'i18next'
import type { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'

// Create global test i18n instance
export const testI18n: i18n = createInstance({
	lng: 'en',
	fallbackLng: 'en',
	ns: ['translation'],
	defaultNS: 'translation',
	interpolation: { escapeValue: false },
	resources: {
		en: {
			translation: {
				common: {
					loading: 'Loading...',
					error: 'Error',
					save: 'Save',
					edit: 'Edit',
					delete: 'Delete',
					cancel: 'Cancel',
					name: 'Name',
					description: 'Description',
					version: 'Version {{version}}',
				},
				project: {
					title: 'Project Details',
					newVersion: 'New Version',
					settings: 'Settings',
					overview: 'Overview',
					brainstorm: 'Brainstorm',
				},
			},
		},
	},
})

// Initialize i18n instance
await testI18n.init()

function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
	return (
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>
				{children}
			</BrowserRouter>
		</I18nextProvider>
	)
}

export function renderWithProviders(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
	return render(ui, { wrapper: Wrapper, ...options })
}