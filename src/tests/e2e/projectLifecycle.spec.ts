import { test, expect } from '@playwright/test';

// Using test directly instead of test.describe to avoid issues with Vitest
test('should create, edit, and delete a project', async ({ page }) => {
  // Go to the home page
  await page.goto('/');

  // Click on the "Create Project" button
  await page.getByRole('button', { name: 'Create Project' }).click();

  // Fill in the project details
  const projectName = `Test Project ${Date.now()}`;
  await page.getByLabel('Project Name').fill(projectName);
  await page.getByLabel('Description').fill('This is a test project created by Playwright');

  // Select a template
  await page.getByLabel('Template').selectOption('software_development');

  // Create the project
  await page.getByRole('button', { name: 'Create' }).click();

  // Verify we're on the project detail page
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

  // Switch to the Brainstorming tab
  await page.getByRole('tab', { name: 'Brainstorm' }).click();

  // Add a new node
  await page.getByRole('button', { name: 'Add Node' }).click();

  // Fill in the node details
  await page.getByLabel('Node Title').fill('Test Node');
  await page.getByLabel('Content').fill('This is a test node');

  // Save the node
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify the node is visible
  await expect(page.getByText('Test Node')).toBeVisible();

  // Save the project
  await page.getByRole('button', { name: 'Save' }).click();

  // Delete the node
  await page.getByText('Test Node').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify the node is no longer visible
  await expect(page.getByText('Test Node')).not.toBeVisible();

  // Go back to the projects list
  await page.getByRole('link', { name: 'Projects' }).click();

  // Verify the project is in the list
  await expect(page.getByText(projectName)).toBeVisible();

  // Archive the project
  await page.getByText(projectName).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify the project is archived
  await page.getByRole('checkbox', { name: 'Show Archived' }).check();
  await expect(page.getByText(projectName).locator('..').getByText('Archived')).toBeVisible();

  // Delete the project
  await page.getByText(projectName).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify the project is deleted
  await expect(page.getByText(projectName)).not.toBeVisible();
});

test('should add, edit, and delete nodes in a project', async ({ page }) => {
  // Create a new project
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Project' }).click();

  const projectName = `Brainstorm Test ${Date.now()}`;
  await page.getByLabel('Project Name').fill(projectName);
  await page.getByLabel('Description').fill('Project for testing brainstorming features');
  await page.getByLabel('Template').selectOption('custom');
  await page.getByRole('button', { name: 'Create' }).click();

  // Switch to the Brainstorming tab
  await page.getByRole('tab', { name: 'Brainstorm' }).click();

  // Add a new node
  await page.getByRole('button', { name: 'Add Node' }).click();
  await page.getByLabel('Node Title').fill('Main Idea');
  await page.getByLabel('Content').fill('This is the main idea for the project');
  await page.getByLabel('Node Type').selectOption('idea');
  await page.getByLabel('Tags').fill('main,idea,important');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify the node is visible
  await expect(page.getByText('Main Idea')).toBeVisible();

  // Add a second node
  await page.getByRole('button', { name: 'Add Node' }).click();
  await page.getByLabel('Node Title').fill('Task 1');
  await page.getByLabel('Content').fill('This is a task related to the main idea');
  await page.getByLabel('Node Type').selectOption('task');
  await page.getByLabel('Tags').fill('task,todo');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify the second node is visible
  await expect(page.getByText('Task 1')).toBeVisible();

  // Connect the nodes
  await page.getByText('Main Idea').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Add Connection' }).click();
  await page.getByText('Task 1').click();

  // Edit the first node
  await page.getByText('Main Idea').dblclick();
  await page.getByLabel('Content').fill('Updated main idea content');
  await page.getByRole('button', { name: 'Save' }).click();

  // Delete the second node
  await page.getByText('Task 1').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify the second node is deleted
  await expect(page.getByText('Task 1')).not.toBeVisible();

  // Save the project
  await page.getByRole('button', { name: 'Save' }).click();

  // Go to the settings tab
  await page.getByRole('tab', { name: 'Settings' }).click();

  // Export the project
  await page.getByRole('button', { name: 'Export to File' }).click();

  // Clean up - go back to projects and delete the test project
  await page.getByRole('link', { name: 'Projects' }).click();
  await page.getByText(projectName).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
});
