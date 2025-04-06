import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should adapt to desktop viewport', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('header');
    
    // Check that the drawer is open by default on desktop
    await expect(page.locator('nav')).toBeVisible();
    
    // Create a new project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Desktop Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Add a new node
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Desktop Node');
    await page.fill('textarea[name="content"]', 'This node was created on desktop');
    await page.click('button:has-text("Add")');
    
    // Check that the node was added with desktop styling
    const nodeElement = page.locator('text=Desktop Node').first();
    const nodeBox = await nodeElement.boundingBox();
    
    // Desktop nodes should be wider
    expect(nodeBox?.width).toBeGreaterThan(200);
  });
  
  test('should adapt to tablet viewport', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('header');
    
    // Check that the drawer is closed by default on tablet
    await expect(page.locator('nav')).not.toBeVisible();
    
    // Open the drawer
    await page.click('button[aria-label="open drawer"]');
    
    // Check that the drawer is now visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Create a new project
    await page.click('text=New Project');
    await page.fill('input[name="name"]', 'Tablet Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Add a new node
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Tablet Node');
    await page.fill('textarea[name="content"]', 'This node was created on tablet');
    await page.click('button:has-text("Add")');
    
    // Check that the node was added with tablet styling
    const nodeElement = page.locator('text=Tablet Node').first();
    const nodeBox = await nodeElement.boundingBox();
    
    // Tablet nodes should be medium width
    expect(nodeBox?.width).toBeLessThan(250);
    expect(nodeBox?.width).toBeGreaterThan(150);
  });
  
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('header');
    
    // Check that the drawer is closed by default on mobile
    await expect(page.locator('nav')).not.toBeVisible();
    
    // Open the drawer
    await page.click('button[aria-label="open drawer"]');
    
    // Check that the drawer is now visible
    await expect(page.locator('nav')).toBeVisible();
    
    // Close the drawer by clicking outside
    await page.click('text=d.o.it.brainstorming');
    
    // Check that the drawer is closed
    await expect(page.locator('nav')).not.toBeVisible();
    
    // Create a new project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Mobile Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Add a new node
    await page.click('[aria-label="Add Node"]');
    await page.fill('input[name="label"]', 'Mobile Node');
    await page.fill('textarea[name="content"]', 'This node was created on mobile');
    await page.click('button:has-text("Add")');
    
    // Check that the node was added with mobile styling
    const nodeElement = page.locator('text=Mobile Node').first();
    const nodeBox = await nodeElement.boundingBox();
    
    // Mobile nodes should be narrower
    expect(nodeBox?.width).toBeLessThan(200);
    
    // Check that the content is collapsed on mobile
    await expect(page.locator('text=tap to expand')).toBeVisible();
  });
  
  test('should show different controls on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the application
    await page.goto('/');
    
    // Create a new project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Mobile Controls Project');
    await page.click('button:has-text("Create")');
    
    // Wait for the project to load
    await page.waitForSelector('[aria-label="Add Node"]');
    
    // Check that the mobile-specific controls are visible
    await expect(page.locator('button[aria-label="Add Node"]')).toBeVisible();
    
    // Check that the speed dial is used on mobile
    await expect(page.locator('[aria-label="speed-dial"]')).toBeVisible();
    
    // Open the speed dial
    await page.click('[aria-label="speed-dial"]');
    
    // Check that the speed dial actions are visible
    await expect(page.locator('[aria-label="Zoom In"]')).toBeVisible();
    await expect(page.locator('[aria-label="Zoom Out"]')).toBeVisible();
    await expect(page.locator('[aria-label="Fit View"]')).toBeVisible();
  });
});
