import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the projects page
    await page.goto('/projects');
  });

  test('should display the projects list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check that the projects page is loaded using a more specific selector
    await expect(page.locator('h1:has-text("My Projects")')).toBeVisible({ timeout: 10000 });

    // Check that the create project button is visible
    await expect(page.getByRole('button', { name: /create project/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should create a new project', async ({ page }) => {
    // Click the create project button
    await page.getByRole('button', { name: /create project/i }).click();

    // Wait for the dialog to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill in the project details
    await dialog.getByLabel(/name/i).fill('Test Project');
    await dialog.getByLabel(/description/i).fill('This is a test project created by Playwright');

    // Select a template
    await dialog.getByRole('button', { name: /template/i }).click();
    await page.getByRole('option', { name: /business plan/i }).click();

    // Create the project
    await dialog.getByRole('button', { name: /create/i }).click();

    // Wait for the project to be created and redirected to the project page
    await expect(page.url()).toContain('/projects/');

    // Check that the project name is displayed
    await expect(page.getByRole('heading', { name: 'Test Project' })).toBeVisible();
  });

  test('should edit a project', async ({ page }) => {
    // Create a project first
    await page.getByRole('button', { name: /create project/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/name/i).fill('Project to Edit');
    await dialog.getByRole('button', { name: /create/i }).click();

    // Wait for the project to be created
    await expect(page.url()).toContain('/projects');

    // Go to the settings tab
    await page.getByRole('tab', { name: /settings/i }).click();

    // Edit the project name
    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill('Edited Project');

    // Save the changes
    await page.getByRole('button', { name: /save/i }).click();

    // Check that the changes were saved
    await expect(page.getByRole('heading', { name: 'Edited Project' })).toBeVisible();
  });

  test('should delete a project', async ({ page }) => {
    // Create a project first
    await page.getByRole('button', { name: /create project/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/name/i).fill('Project to Delete');
    await dialog.getByRole('button', { name: /create/i }).click();

    // Wait for the project to be created
    await expect(page.url()).toContain('/projects');

    // Go to the settings tab
    await page.getByRole('tab', { name: /settings/i }).click();

    // Click the delete button
    await page.getByRole('button', { name: /delete project/i }).click();

    // Confirm deletion
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /delete/i }).click();

    // Check that we're redirected to the projects page
    await expect(page.url()).toBe('/projects');

    // Check that the project is no longer in the list
    await expect(page.getByText('Project to Delete')).not.toBeVisible();
  });
});
