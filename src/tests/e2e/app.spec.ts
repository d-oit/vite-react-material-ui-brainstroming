import { test, expect } from '@playwright/test'

test.describe('App', () => {
	test('should load the homepage', async ({ page }) => {
		await page.goto('/')

		// Check that the page title is correct
		await expect(page).toHaveTitle(/d.o.it.brainstorming/)

		// Check that the app header is visible
		const header = page.locator('header')
		await expect(header).toBeVisible()
	})

	test('should navigate to projects page', async ({ page }) => {
		await page.goto('/')

		// Click on the projects link in the navigation
		await page.getByRole('link', { name: /projects/i }).click()

		// Check that we're on the projects page
		await expect(page).toHaveURL(/.*\/projects/)

		// Check that the projects page content is visible
		// Use a more specific selector to avoid ambiguity
		const projectsHeading = page.locator('h1:has-text("My Projects")')
		await expect(projectsHeading).toBeVisible({ timeout: 10000 })
	})

	test('should open quick brainstorm', async ({ page }) => {
		await page.goto('/')

		// Click on the quick brainstorm button
		await page.getByRole('button', { name: /quick brainstorm/i }).click()

		// Wait for navigation and loading
		await page.waitForTimeout(2000)

		// Check that the brainstorm editor is visible
		const brainstormEditor = page.locator('.react-flow')
		await expect(brainstormEditor).toBeVisible({ timeout: 10000 })
	})

	test('should toggle dark mode', async ({ page }) => {
		await page.goto('/')

		// Get the initial theme
		const initialTheme = await page.evaluate(() => {
			return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
		})

		// Click on the theme toggle button
		await page.getByRole('button', { name: /toggle dark mode/i }).click()

		// Check that the theme has changed
		const newTheme = await page.evaluate(() => {
			return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
		})

		expect(newTheme).not.toBe(initialTheme)
	})
})
