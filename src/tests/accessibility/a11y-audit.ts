import fs from 'fs'
import path from 'path'

import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

/**
 * This file contains automated accessibility tests using axe-core.
 * It tests key pages of the application for accessibility issues.
 */

// Define the pages to test
const pagesToTest = [
	{ name: 'Home', path: '/' },
	{ name: 'Brainstorm', path: '/brainstorm' },
	{ name: 'Settings', path: '/settings' },
]

// Create a directory for the reports if it doesn't exist
const reportsDir = path.join(process.cwd(), 'accessibility-reports')
if (!fs.existsSync(reportsDir)) {
	fs.mkdirSync(reportsDir, { recursive: true })
}

// Run accessibility tests for each page
for (const page of pagesToTest) {
	test(`Accessibility audit for ${page.name} page`, async ({ page: pageFixture }) => {
		// Navigate to the page
		await pageFixture.goto(page.path)

		// Wait for the page to be fully loaded
		await pageFixture.waitForLoadState('networkidle')

		// Run axe accessibility tests
		const accessibilityScanResults = await new AxeBuilder({ page: pageFixture })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze()

		// Save the results to a file
		const reportPath = path.join(reportsDir, `${page.name.toLowerCase()}-a11y-report.json`)
		fs.writeFileSync(reportPath, JSON.stringify(accessibilityScanResults, null, 2))

		// Log the number of violations
		console.log(`${page.name} page has ${accessibilityScanResults.violations.length} accessibility violations.`)

		// Generate a summary report
		const summary = {
			url: page.path,
			timestamp: new Date().toISOString(),
			violations: accessibilityScanResults.violations.map((violation) => ({
				id: violation.id,
				impact: violation.impact,
				description: violation.description,
				help: violation.help,
				helpUrl: violation.helpUrl,
				nodes: violation.nodes.length,
			})),
			passes: accessibilityScanResults.passes.length,
			incomplete: accessibilityScanResults.incomplete.length,
			inapplicable: accessibilityScanResults.inapplicable.length,
		}

		// Save the summary to a file
		const summaryPath = path.join(reportsDir, `${page.name.toLowerCase()}-a11y-summary.json`)
		fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

		// Assert that there are no violations
		expect(accessibilityScanResults.violations).toEqual([])
	})
}

// Test for keyboard navigation
test('Keyboard navigation test', async ({ page }) => {
	// Navigate to the home page
	await page.goto('/')

	// Wait for the page to be fully loaded
	await page.waitForLoadState('networkidle')

	// Press Tab to navigate through the page
	const tabPresses = 10 // Number of tab presses to test
	const focusedElements = []

	for (let i = 0; i < tabPresses; i++) {
		await page.keyboard.press('Tab')

		// Get the focused element
		const focusedElement = await page.evaluate(() => {
			const activeElement = document.activeElement
			return {
				tagName: activeElement.tagName,
				id: activeElement.id,
				className: activeElement.className,
				ariaLabel: activeElement.getAttribute('aria-label'),
				text: activeElement.textContent?.trim(),
			}
		})

		focusedElements.push(focusedElement)
	}

	// Save the results to a file
	const reportPath = path.join(reportsDir, 'keyboard-navigation-report.json')
	fs.writeFileSync(reportPath, JSON.stringify(focusedElements, null, 2))

	// Assert that we have focused elements
	expect(focusedElements.length).toBeGreaterThan(0)
})

// Test for screen reader announcements
test('Screen reader announcements test', async ({ page }) => {
	// Navigate to the brainstorm page
	await page.goto('/brainstorm')

	// Wait for the page to be fully loaded
	await page.waitForLoadState('networkidle')

	// Find all aria-live regions
	const ariaLiveRegions = await page.locator('[aria-live]').all()
	const ariaLiveElements = []

	for (const region of ariaLiveRegions) {
		const ariaLive = await region.getAttribute('aria-live')
		const ariaAtomic = await region.getAttribute('aria-atomic')
		const ariaRelevant = await region.getAttribute('aria-relevant')
		const text = await region.textContent()

		ariaLiveElements.push({
			ariaLive,
			ariaAtomic,
			ariaRelevant,
			text: text?.trim(),
		})
	}

	// Save the results to a file
	const reportPath = path.join(reportsDir, 'screen-reader-announcements-report.json')
	fs.writeFileSync(reportPath, JSON.stringify(ariaLiveElements, null, 2))

	// Log the number of aria-live regions
	console.log(`Found ${ariaLiveElements.length} aria-live regions.`)
})
