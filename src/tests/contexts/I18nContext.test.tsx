import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'

import { I18nProvider, useI18n } from '../../contexts/I18nContext'
import { translations } from '../../i18n'

// Test component that uses the I18n context
const TestComponent = () => {
	const { locale, setLocale, t } = useI18n()

	return (
		<div>
			<div data-testid="current-locale">{locale}</div>
			<div data-testid="translated-home">{t('navigation.home')}</div>
			<div data-testid="translated-projects">{t('navigation.projects')}</div>
			<div data-testid="translated-settings">{t('navigation.settings')}</div>
			<div data-testid="translated-quickBrainstorm">{t('navigation.quickBrainstorm')}</div>
			<div data-testid="translated-performance">{t('navigation.performance')}</div>
			<div data-testid="translated-app-title">{t('app.title')}</div>
			<div data-testid="translated-with-params">{t('app.copyright', { year: 2023 })}</div>
			<div data-testid="missing-key">{t('this.key.does.not.exist')}</div>

			<button onClick={() => setLocale('en')}>English</button>
			<button onClick={() => setLocale('de')}>German</button>
			<button onClick={() => setLocale('fr')}>French</button>
			<button onClick={() => setLocale('es')}>Spanish</button>
			<button onClick={() => setLocale('invalid')}>Invalid</button>
		</div>
	)
}

describe('I18nContext', () => {
	it('provides default translations (English) when no locale is specified', () => {
		render(
			<I18nProvider>
				<TestComponent />
			</I18nProvider>,
		)

		// Check that the default locale is 'en'
		expect(screen.getByTestId('current-locale')).toHaveTextContent('en')

		// Check that English translations are provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Home')
		expect(screen.getByTestId('translated-projects')).toHaveTextContent('Projects')
		expect(screen.getByTestId('translated-settings')).toHaveTextContent('Settings')
		expect(screen.getByTestId('translated-quickBrainstorm')).toHaveTextContent('Quick Brainstorm')
		expect(screen.getByTestId('translated-performance')).toHaveTextContent('Performance')
	})

	it('loads German translations when locale is set to "de"', async () => {
		render(
			<I18nProvider initialLocale="de">
				<TestComponent />
			</I18nProvider>,
		)

		// Check that the locale is 'de'
		expect(screen.getByTestId('current-locale')).toHaveTextContent('de')

		// Check that German translations are provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Startseite')
		expect(screen.getByTestId('translated-projects')).toHaveTextContent('Projekte')
		expect(screen.getByTestId('translated-settings')).toHaveTextContent('Einstellungen')
		expect(screen.getByTestId('translated-quickBrainstorm')).toHaveTextContent('Schnelles Brainstorming')
		expect(screen.getByTestId('translated-performance')).toHaveTextContent('Leistung')
	})

	it('loads French translations when locale is set to "fr"', async () => {
		render(
			<I18nProvider initialLocale="fr">
				<TestComponent />
			</I18nProvider>,
		)

		// Check that the locale is 'fr'
		expect(screen.getByTestId('current-locale')).toHaveTextContent('fr')

		// Check that French translations are provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Accueil')
		expect(screen.getByTestId('translated-projects')).toHaveTextContent('Projets')
		expect(screen.getByTestId('translated-settings')).toHaveTextContent('Paramètres')
		expect(screen.getByTestId('translated-quickBrainstorm')).toHaveTextContent('Brainstorming Rapide')
		expect(screen.getByTestId('translated-performance')).toHaveTextContent('Performance')
	})

	it('loads Spanish translations when locale is set to "es"', async () => {
		render(
			<I18nProvider initialLocale="es">
				<TestComponent />
			</I18nProvider>,
		)

		// Check that the locale is 'es'
		expect(screen.getByTestId('current-locale')).toHaveTextContent('es')

		// Check that Spanish translations are provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Inicio')
		expect(screen.getByTestId('translated-projects')).toHaveTextContent('Proyectos')
		expect(screen.getByTestId('translated-settings')).toHaveTextContent('Configuración')
		expect(screen.getByTestId('translated-quickBrainstorm')).toHaveTextContent('Lluvia de Ideas Rápida')
		expect(screen.getByTestId('translated-performance')).toHaveTextContent('Rendimiento')
	})

	it('changes translations when locale is changed', async () => {
		render(
			<I18nProvider initialLocale="en">
				<TestComponent />
			</I18nProvider>,
		)

		// Check initial English translations
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Home')

		// Change locale to German
		fireEvent.click(screen.getByText('German'))

		// Check that German translations are now provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Startseite')

		// Change locale to French
		fireEvent.click(screen.getByText('French'))

		// Check that French translations are now provided
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Accueil')
	})

	it('falls back to English for unsupported locales', async () => {
		// Mock console.warn to avoid polluting test output
		const originalWarn = console.warn
		console.warn = vi.fn()

		render(
			<I18nProvider initialLocale="invalid">
				<TestComponent />
			</I18nProvider>,
		)

		// Check that English translations are provided as fallback
		expect(screen.getByTestId('translated-home')).toHaveTextContent('Home')

		// Restore console.warn
		console.warn = originalWarn
	})

	it('handles missing translation keys by returning the key itself', () => {
		render(
			<I18nProvider>
				<TestComponent />
			</I18nProvider>,
		)

		// Check that missing keys return the key itself
		expect(screen.getByTestId('missing-key')).toHaveTextContent('this.key.does.not.exist')
	})

	it('handles parameter substitution in translations', () => {
		render(
			<I18nProvider>
				<TestComponent />
			</I18nProvider>,
		)

		// Check that parameters are substituted correctly
		expect(screen.getByTestId('translated-with-params')).toHaveTextContent('© 2023 d.o.it.brainstorming')
	})

	it('verifies all supported languages have the same translation keys', () => {
		// Get all keys from English translations (our reference)
		const enKeys = getAllKeys(translations.en)

		// Check that all other languages have the same keys
		for (const lang of ['de', 'fr', 'es']) {
			const langKeys = getAllKeys(translations[lang as keyof typeof translations])

			// Check that all English keys exist in this language
			for (const key of enKeys) {
				expect(hasKey(translations[lang as keyof typeof translations], key)).toBe(true)
			}

			// Check that this language doesn't have extra keys
			expect(langKeys.length).toBe(enKeys.length)
		}
	})
})

// Helper function to get all keys from a nested object
function getAllKeys(obj: any, prefix = ''): string[] {
	let keys: string[] = []

	for (const key in obj) {
		const newKey = prefix ? `${prefix}.${key}` : key

		if (typeof obj[key] === 'object' && obj[key] !== null) {
			keys = [...keys, ...getAllKeys(obj[key], newKey)]
		} else {
			keys.push(newKey)
		}
	}

	return keys
}

// Helper function to check if a key exists in a nested object
function hasKey(obj: any, key: string): boolean {
	const parts = key.split('.')
	let current = obj

	for (const part of parts) {
		if (current === undefined || current === null || typeof current !== 'object' || !(part in current)) {
			return false
		}
		current = current[part]
	}

	return true
}
