import { test, expect } from '@playwright/test'

test.describe('Project Management', () => {
	test('should create a new project', async ({ page }) => {
		// Go to the home page
		await page.goto('/')

		// Navigate to the projects page
		await page.getByRole('link', { name: 'My Projects' }).click()

		// Wait for the page to load
		await page.waitForTimeout(1000)

		// Click on the "Create New Project" button if it exists
		const createButton = page.getByRole('button', { name: 'Create New Project' })
		if (await createButton.isVisible()) {
			await createButton.click()
		} else {
			// If the button doesn't exist, we might be on a different UI version
			// Try the "+" button or other alternatives
			const addButton = page.getByRole('button', { name: '+' })
			if (await addButton.isVisible()) {
				await addButton.click()
			}
		}

		// Wait for the dialog to appear
		await page.waitForTimeout(1000)

		// Fill in the project details
		const projectName = `Test Project ${Date.now()}`
		await page.getByLabel('Project Name').fill(projectName)
		await page.getByLabel('Description').fill('This is a test project created by Playwright')

		// Select a template if the field exists
		const templateSelect = page.getByLabel('Template')
		if (await templateSelect.isVisible()) {
			await templateSelect.selectOption('blank')
		}

		// Create the project
		await page.getByRole('button', { name: 'Create' }).click()

		// Wait for the project to be created
		await page.waitForTimeout(2000)

		// Verify that the project was created
		await expect(page.getByText(projectName)).toBeVisible()

		// Return the project name for use in other tests
		return projectName
	})

	test('should edit a project', async ({ page }) => {
		// First create a project
		const projectName = await test.step('Create a project', async () => {
			// Go to the home page
			await page.goto('/')

			// Navigate to the projects page
			await page.getByRole('link', { name: 'My Projects' }).click()

			// Wait for the page to load
			await page.waitForTimeout(1000)

			// Click on the "Create New Project" button if it exists
			const createButton = page.getByRole('button', { name: 'Create New Project' })
			if (await createButton.isVisible()) {
				await createButton.click()
			} else {
				// If the button doesn't exist, we might be on a different UI version
				// Try the "+" button or other alternatives
				const addButton = page.getByRole('button', { name: '+' })
				if (await addButton.isVisible()) {
					await addButton.click()
				}
			}

			// Wait for the dialog to appear
			await page.waitForTimeout(1000)

			// Fill in the project details
			const name = `Edit Test Project ${Date.now()}`
			await page.getByLabel('Project Name').fill(name)
			await page.getByLabel('Description').fill('This project will be edited')

			// Select a template if the field exists
			const templateSelect = page.getByLabel('Template')
			if (await templateSelect.isVisible()) {
				await templateSelect.selectOption('blank')
			}

			// Create the project
			await page.getByRole('button', { name: 'Create' }).click()

			// Wait for the project to be created
			await page.waitForTimeout(2000)

			return name
		})

		// Now edit the project
		await test.step('Edit the project', async () => {
			// Click on the project to open it
			await page.getByText(projectName).click()

			// Wait for the project to load
			await page.waitForTimeout(1000)

			// Look for an edit button or settings tab
			const settingsTab = page.getByRole('tab', { name: 'Settings' })
			if (await settingsTab.isVisible()) {
				await settingsTab.click()
			}

			// Wait for the settings page to load
			await page.waitForTimeout(1000)

			// Edit the project name
			const nameInput = page.getByLabel('Project Name')
			if (await nameInput.isVisible()) {
				await nameInput.clear()
				await nameInput.fill(`${projectName} (Edited)`)
			}

			// Edit the project description
			const descriptionInput = page.getByLabel('Description')
			if (await descriptionInput.isVisible()) {
				await descriptionInput.clear()
				await descriptionInput.fill('This project has been edited')
			}

			// Save the changes
			const saveButton = page.getByRole('button', { name: 'Save' })
			if (await saveButton.isVisible()) {
				await saveButton.click()
			}

			// Wait for the changes to be saved
			await page.waitForTimeout(1000)

			// Verify that the changes were saved
			await expect(page.getByText(`${projectName} (Edited)`)).toBeVisible()
		})
	})

	test('should delete a project', async ({ page }) => {
		// First create a project
		const projectName = await test.step('Create a project', async () => {
			// Go to the home page
			await page.goto('/')

			// Navigate to the projects page
			await page.getByRole('link', { name: 'My Projects' }).click()

			// Wait for the page to load
			await page.waitForTimeout(1000)

			// Click on the "Create New Project" button if it exists
			const createButton = page.getByRole('button', { name: 'Create New Project' })
			if (await createButton.isVisible()) {
				await createButton.click()
			} else {
				// If the button doesn't exist, we might be on a different UI version
				// Try the "+" button or other alternatives
				const addButton = page.getByRole('button', { name: '+' })
				if (await addButton.isVisible()) {
					await addButton.click()
				}
			}

			// Wait for the dialog to appear
			await page.waitForTimeout(1000)

			// Fill in the project details
			const name = `Delete Test Project ${Date.now()}`
			await page.getByLabel('Project Name').fill(name)
			await page.getByLabel('Description').fill('This project will be deleted')

			// Select a template if the field exists
			const templateSelect = page.getByLabel('Template')
			if (await templateSelect.isVisible()) {
				await templateSelect.selectOption('blank')
			}

			// Create the project
			await page.getByRole('button', { name: 'Create' }).click()

			// Wait for the project to be created
			await page.waitForTimeout(2000)

			return name
		})

		// Now delete the project
		await test.step('Delete the project', async () => {
			// Click on the project to open it
			await page.getByText(projectName).click()

			// Wait for the project to load
			await page.waitForTimeout(1000)

			// Look for an edit button or settings tab
			const settingsTab = page.getByRole('tab', { name: 'Settings' })
			if (await settingsTab.isVisible()) {
				await settingsTab.click()
			}

			// Wait for the settings page to load
			await page.waitForTimeout(1000)

			// Look for a delete button
			const deleteButton = page.getByRole('button', { name: 'Delete' })
			if (await deleteButton.isVisible()) {
				await deleteButton.click()
			}

			// Wait for the confirmation dialog
			await page.waitForTimeout(1000)

			// Confirm deletion
			const confirmButton = page.getByRole('button', { name: 'Delete' }).nth(1)
			if (await confirmButton.isVisible()) {
				await confirmButton.click()
			}

			// Wait for the project to be deleted
			await page.waitForTimeout(1000)

			// Verify that we're back on the projects page
			expect(page.url()).toContain('/projects')

			// Verify that the project is no longer visible
			await expect(page.getByText(projectName)).not.toBeVisible()
		})
	})

	test('should test offline functionality', async ({ page }) => {
		// Create a project
		const projectName = await test.step('Create a project', async () => {
			// Go to the home page
			await page.goto('/')

			// Navigate to the projects page
			await page.getByRole('link', { name: 'My Projects' }).click()

			// Wait for the page to load
			await page.waitForTimeout(1000)

			// Click on the "Create New Project" button if it exists
			const createButton = page.getByRole('button', { name: 'Create New Project' })
			if (await createButton.isVisible()) {
				await createButton.click()
			} else {
				// If the button doesn't exist, we might be on a different UI version
				// Try the "+" button or other alternatives
				const addButton = page.getByRole('button', { name: '+' })
				if (await addButton.isVisible()) {
					await addButton.click()
				}
			}

			// Wait for the dialog to appear
			await page.waitForTimeout(1000)

			// Fill in the project details
			const name = `Offline Test Project ${Date.now()}`
			await page.getByLabel('Project Name').fill(name)
			await page.getByLabel('Description').fill('This project will be edited offline')

			// Select a template if the field exists
			const templateSelect = page.getByLabel('Template')
			if (await templateSelect.isVisible()) {
				await templateSelect.selectOption('blank')
			}

			// Create the project
			await page.getByRole('button', { name: 'Create' }).click()

			// Wait for the project to be created
			await page.waitForTimeout(2000)

			return name
		})

		// Go offline
		await test.step('Go offline and edit the project', async () => {
			// Go offline
			await page.context().setOffline(true)

			// Click on the project to open it
			await page.getByText(projectName).click()

			// Wait for the project to load
			await page.waitForTimeout(1000)

			// Look for an edit button or settings tab
			const settingsTab = page.getByRole('tab', { name: 'Settings' })
			if (await settingsTab.isVisible()) {
				await settingsTab.click()
			}

			// Wait for the settings page to load
			await page.waitForTimeout(1000)

			// Edit the project name
			const nameInput = page.getByLabel('Project Name')
			if (await nameInput.isVisible()) {
				await nameInput.clear()
				await nameInput.fill(`${projectName} (Offline Edit)`)
			}

			// Save the changes
			const saveButton = page.getByRole('button', { name: 'Save' })
			if (await saveButton.isVisible()) {
				await saveButton.click()
			}

			// Wait for the changes to be saved
			await page.waitForTimeout(1000)

			// Verify that the changes were saved locally
			await expect(page.getByText(`${projectName} (Offline Edit)`)).toBeVisible()
		})

		// Go back online
		await test.step('Go back online and verify changes', async () => {
			// Go back online
			await page.context().setOffline(false)

			// Refresh the page
			await page.reload()

			// Wait for the page to load
			await page.waitForTimeout(2000)

			// Verify that the offline changes were synchronized
			await expect(page.getByText(`${projectName} (Offline Edit)`)).toBeVisible()
		})
	})
})
