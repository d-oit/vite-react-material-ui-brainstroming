import { test, expect } from '@playwright/test'

test('homepage has correct title and content', async ({ page }) => {
	await page.goto('/')

	// Check the title
	await expect(page).toHaveTitle(/d.o.it.brainstorming/)

	// Check for main content - look for the header or any text that's definitely on the homepage
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

	// Check for the add button which should be visible on the homepage
	await expect(page.getByRole('button', { name: 'add' })).toBeVisible()
})

test('can navigate to settings page', async ({ page }) => {
	await page.goto('/')

	// Navigate to Settings page
	await page.getByRole('button', { name: 'Menu' }).click()
	await page.getByText('Settings').click()

	// Check that we're on the Settings page by looking for settings-related content
	await expect(page.getByText('Theme')).toBeVisible()
	await expect(page.getByText('Language')).toBeVisible()
})
