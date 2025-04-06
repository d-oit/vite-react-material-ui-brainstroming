import { test, expect } from '@playwright/test';

test.describe('Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('header');
  });
  
  test('should show offline indicator when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Check that the offline indicator is displayed
    await expect(page.locator('[aria-label="Offline"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Check that the offline indicator is hidden
    await expect(page.locator('[aria-label="Offline"]')).not.toBeVisible();
  });
  
  test('should continue to work when offline', async ({ page, context }) => {
    // Create a new project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Offline Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Add a new node
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Offline Node');
    await page.fill('textarea[name="content"]', 'This node was created offline');
    await page.click('button:has-text("Add")');
    
    // Check that the node was added
    await expect(page.locator('text=Offline Node')).toBeVisible();
    await expect(page.locator('text=This node was created offline')).toBeVisible();
    
    // Edit the node
    await page.click('[aria-label="Edit node"]');
    await page.fill('input[name="label"]', 'Updated Offline Node');
    await page.click('button:has-text("Save")');
    
    // Check that the node was updated
    await expect(page.locator('text=Updated Offline Node')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Check that the node is still there
    await expect(page.locator('text=Updated Offline Node')).toBeVisible();
  });
  
  test('should disable chat functionality when offline', async ({ page, context }) => {
    // Navigate to a project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Chat Test Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Open the chat panel
    await page.click('button:has-text("Chat")');
    
    // Check that the chat input is enabled
    const chatInput = page.locator('textarea[placeholder*="Type a message"]');
    await expect(chatInput).toBeEnabled();
    
    // Go offline
    await context.setOffline(true);
    
    // Check that the chat input is disabled
    await expect(chatInput).toBeDisabled();
    
    // Check that the offline warning is displayed
    await expect(page.locator('text=You are currently offline')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Check that the chat input is enabled again
    await expect(chatInput).toBeEnabled();
  });
  
  test('should disable S3 sync when offline', async ({ page, context }) => {
    // Navigate to the settings page
    await page.click('button[aria-label="open drawer"]');
    await page.click('text=Settings');
    
    // Navigate to the S3 settings tab
    await page.click('text=S3 Sync');
    
    // Check that the sync button is enabled
    const syncButton = page.locator('button:has-text("Sync Now")');
    
    // Go offline
    await context.setOffline(true);
    
    // Check that the sync button is disabled
    await expect(syncButton).toBeDisabled();
    
    // Check that the offline warning is displayed
    await expect(page.locator('text=S3 synchronization is unavailable while offline')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Check that the sync button is enabled again
    await expect(syncButton).toBeEnabled();
  });
});
