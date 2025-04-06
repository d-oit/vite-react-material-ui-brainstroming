import { test, expect } from '@playwright/test';

test.describe('Basic Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await page.waitForSelector('header');
  });

  test('should display the application title', async ({ page }) => {
    // Check that the title is displayed
    const title = await page.locator('header h6').textContent();
    expect(title).toContain('d.o.it.brainstorming');
  });

  test('should navigate to different pages', async ({ page }) => {
    // Open the menu
    await page.click('button[aria-label="open drawer"]');

    // Navigate to the settings page
    await page.click('text=Settings');

    // Check that the settings page is displayed
    await expect(page.locator('h4')).toContainText('Settings');

    // Navigate back to the home page
    await page.click('button[aria-label="open drawer"]');
    await page.click('text=Home');

    // Check that the home page is displayed
    await expect(page.locator('h4')).toContainText('Projects');
  });

  test('should create a new project', async ({ page }) => {
    // Click the new project button
    await page.click('button:has-text("New Project")');

    // Fill in the project name
    await page.fill('input[name="name"]', 'Test Project');

    // Create the project
    await page.click('button:has-text("Create")');

    // Check that the project was created
    await expect(page.locator('h4')).toContainText('Test Project');
  });

  test('should add a new node to a project', async ({ page }) => {
    // Create a new project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Test Project');
    await page.click('button:has-text("Create")');

    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');

    // Add a new node
    await page.click('[aria-label="Add Node"]');

    // Fill in the node details
    await page.fill('input[name="label"]', 'Test Node');
    await page.fill('textarea[name="content"]', 'This is a test node');

    // Add a tag
    await page.fill('input[placeholder="Add tag"]', 'test-tag');
    await page.keyboard.press('Enter');

    // Save the node
    await page.click('button:has-text("Add")');

    // Check that the node was added
    await expect(page.locator('text=Test Node')).toBeVisible();
    await expect(page.locator('text=This is a test node')).toBeVisible();
    await expect(page.locator('text=test-tag')).toBeVisible();
  });

  test('should edit a node', async ({ page }) => {
    // Create a new project with a node
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Test Project');
    await page.click('button:has-text("Create")');
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Test Node');
    await page.fill('textarea[name="content"]', 'This is a test node');
    await page.click('button:has-text("Add")');

    // Wait for the node to be added
    await page.waitForSelector('text=Test Node');

    // Click the edit button on the node
    await page.click('[aria-label="Edit node"]');

    // Update the node details
    await page.fill('input[name="label"]', 'Updated Node');
    await page.fill('textarea[name="content"]', 'This node has been updated');

    // Save the changes
    await page.click('button:has-text("Save")');

    // Check that the node was updated
    await expect(page.locator('text=Updated Node')).toBeVisible();
    await expect(page.locator('text=This node has been updated')).toBeVisible();
  });

  test('should delete a node', async ({ page }) => {
    // Create a new project with a node
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Test Project');
    await page.click('button:has-text("Create")');
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Test Node');
    await page.fill('textarea[name="content"]', 'This is a test node');
    await page.click('button:has-text("Add")');

    // Wait for the node to be added
    await page.waitForSelector('text=Test Node');

    // Click the delete button on the node
    await page.click('[aria-label="Delete node"]');

    // Confirm the deletion
    await page.click('button:has-text("Delete")');

    // Check that the node was deleted
    await expect(page.locator('text=Test Node')).not.toBeVisible();
  });

  test('should change theme mode', async ({ page }) => {
    // Open the menu
    await page.click('button[aria-label="open drawer"]');

    // Navigate to the settings page
    await page.click('text=Settings');

    // Change the theme to dark
    await page.click('text=Dark');

    // Check that the theme was changed
    const body = await page.locator('body');
    await expect(body).toHaveClass(/dark/);

    // Change the theme back to light
    await page.click('text=Light');

    // Check that the theme was changed back
    await expect(body).not.toHaveClass(/dark/);
  });
});
