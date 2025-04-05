import { test, expect } from '@playwright/test';

test('homepage has correct title and content', async ({ page }) => {
  await page.goto('/');
  
  // Check the title
  await expect(page).toHaveTitle(/d.o.it.brainstorming/);
  
  // Check for main content
  await expect(page.getByText('My Projects')).toBeVisible();
});

test('can navigate to different pages', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to Chat page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Chat Assistant').click();
  
  // Check that we're on the Chat page
  await expect(page.getByText('Brainstorming Assistant')).toBeVisible();
  
  // Navigate to Settings page
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Settings').click();
  
  // Check that we're on the Settings page
  await expect(page.getByText('Customize your brainstorming experience')).toBeVisible();
});
