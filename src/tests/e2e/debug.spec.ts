import * as fs from 'fs'

import { test } from '@playwright/test'

test('debug quick brainstorm button', async ({ page }) => {
	// Create a log array
	const logs: string[] = []

	// Go to the home page
	await page.goto('/')

	// Wait for the page to load
	await page.waitForTimeout(2000)

	// Take a screenshot before clicking
	await page.screenshot({ path: 'debug-before-click.png' })

	// Log the current URL
	logs.push(`Current URL before click: ${page.url()}`)

	// Find and click the Quick Brainstorm button
	const quickBrainstormButton = page.getByRole('button', { name: 'Quick Brainstorm' })
	logs.push(`Quick Brainstorm button found: ${await quickBrainstormButton.isVisible()}`)

	// Click the button
	await quickBrainstormButton.click()

	// Wait for navigation
	await page.waitForTimeout(2000)

	// Log the URL after clicking
	logs.push(`Current URL after click: ${page.url()}`)

	// Take a screenshot after clicking
	await page.screenshot({ path: 'debug-after-click.png' })

	// Log all buttons on the new page
	logs.push('\nButtons after click:')
	const buttons = await page.getByRole('button').all()
	for (const button of buttons) {
		const text = await button.textContent()
		const isVisible = await button.isVisible()
		logs.push(`- "${text}" (visible: ${isVisible})`)
	}

	// Check for Add Node button
	const addNodeButton = page.getByRole('button', { name: 'Add Node' })
	logs.push(`\nAdd Node button found: ${(await addNodeButton.count()) > 0}`)

	// Check for all elements with aria-label
	logs.push('\nElements with aria-label:')
	const ariaLabelElements = await page.locator('[aria-label]').all()
	for (const element of ariaLabelElements) {
		const ariaLabel = await element.getAttribute('aria-label')
		const text = await element.textContent()
		const isVisible = await element.isVisible()
		logs.push(`- aria-label="${ariaLabel}", text="${text}" (visible: ${isVisible})`)
	}

	// Write logs to file
	fs.writeFileSync('debug-quick-brainstorm.txt', logs.join('\n'))

	// Wait to see the console output
	await page.waitForTimeout(5000)
})
