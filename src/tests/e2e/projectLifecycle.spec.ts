import { test, expect } from '@playwright/test';

test.describe('Project Lifecycle', () => {
test('should navigate to My Projects and back to home', async ({ page }) => {
  // Go to the home page
  await page.goto('/');

  // Click on the "My Projects" link
  await page.getByRole('link', { name: 'My Projects' }).click();

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Verify that we're on the projects page
  await expect(page.url()).toContain('/projects');

  // Go back to the home page
  await page.goto('/');

  // Verify we're back on the home page
  await expect(page.url()).toBe('http://localhost:5173/');
});

test('should click the Quick Brainstorm button', async ({ page }) => {
  // Go to the home page
  await page.goto('/');

  // Click on the "Quick Brainstorm" button
  await page.getByRole('button', { name: 'Quick Brainstorm' }).click();

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Verify we're still on the home page
  await expect(page.url()).toBe('http://localhost:5173/');
});
test('should navigate to My Projects', async ({ page }) => {
  // Go to the home page
  await page.goto('/');

  // Click on the "My Projects" link
  await page.getByRole('link', { name: 'My Projects' }).click();

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Verify that we're on the projects page
  await expect(page.url()).toContain('/projects');
});

});