import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle invalid project creation', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Navigate to the projects page
    await page.getByRole('link', { name: 'My Projects' }).click();

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Click on the "Create New Project" button if it exists
    const createButton = page.getByRole('button', { name: 'Create New Project' });
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      // If the button doesn't exist, we might be on a different UI version
      // Try the "+" button or other alternatives
      const addButton = page.getByRole('button', { name: '+' });
      if (await addButton.isVisible()) {
        await addButton.click();
      }
    }

    // Wait for the dialog to appear
    await page.waitForTimeout(1000);

    // Try to create a project without a name
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify that an error message is displayed
    await expect(page.getByText('Project name is required')).toBeVisible();

    // Fill in the project name but leave description empty
    await page.getByLabel('Project Name').fill('Test Project');
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify that the project is created even without a description
    await page.waitForTimeout(2000);
    await expect(page.getByText('Test Project')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Navigate to the projects page
    await page.getByRole('link', { name: 'My Projects' }).click();

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Go offline
    await page.context().setOffline(true);

    // Try to create a new project
    const createButton = page.getByRole('button', { name: 'Create New Project' });
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    // Wait for the dialog to appear
    await page.waitForTimeout(1000);

    // Fill in the project details
    await page.getByLabel('Project Name').fill('Offline Project');
    await page.getByLabel('Description').fill('Created while offline');

    // Create the project
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for the project to be created
    await page.waitForTimeout(2000);

    // Verify that the project was created locally
    await expect(page.getByText('Offline Project')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
  });

  test('should handle invalid inputs in node creation', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Click on the "Quick Brainstorm" button
    await page.getByRole('button', { name: 'Quick Brainstorm' }).click();

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Try to add a node
    const addNodeButton = page.getByRole('button', { name: 'Add Node' });
    if (await addNodeButton.isVisible()) {
      await addNodeButton.click();
    } else {
      // If the button doesn't exist, we might be on a different UI version
      const addButton = page.getByTestId('add-node-button');
      if (await addButton.isVisible()) {
        await addButton.click();
      }
    }

    // Wait for the dialog to appear
    await page.waitForTimeout(1000);

    // Try to add a node without a title
    const addButton = page.getByRole('button', { name: 'Add' });
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Verify that an error message is displayed
    await expect(page.getByText('Title is required')).toBeVisible();

    // Fill in the title but leave content empty
    await page.getByLabel('Title').fill('Test Node');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify that the node is added even without content
    await page.waitForTimeout(1000);
    await expect(page.getByText('Test Node')).toBeVisible();
  });

  test('should handle browser refresh during editing', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Click on the "Quick Brainstorm" button
    await page.getByRole('button', { name: 'Quick Brainstorm' }).click();

    // Wait for the page to load
    await page.waitForTimeout(1000);

    // Add a node
    const addNodeButton = page.getByRole('button', { name: 'Add Node' });
    if (await addNodeButton.isVisible()) {
      await addNodeButton.click();
    }

    // Wait for the dialog to appear
    await page.waitForTimeout(1000);

    // Fill in the node details
    await page.getByLabel('Title').fill('Refresh Test Node');
    await page.getByLabel('Content').fill('This node will survive a refresh');

    // Add the node
    await page.getByRole('button', { name: 'Add' }).click();

    // Wait for the node to be added
    await page.waitForTimeout(1000);

    // Verify that the node was added
    await expect(page.getByText('Refresh Test Node')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Verify that the node is still there
    await expect(page.getByText('Refresh Test Node')).toBeVisible();
  });
});
