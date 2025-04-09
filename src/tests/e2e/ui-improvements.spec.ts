import { test, expect } from '@playwright/test';

test.describe('UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should have proper layout structure with no overlapping elements', async ({ page }) => {
    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Check that the brainstorm editor is loaded
    await expect(page.locator('.react-flow')).toBeVisible();

    // Verify toolbar is positioned correctly at the top center
    const toolbar = page
      .locator('.react-flow')
      .locator('div')
      .filter({ hasText: /zoom in/i })
      .first();
    await expect(toolbar).toBeVisible();

    // Get toolbar position
    const toolbarBox = await toolbar.boundingBox();
    expect(toolbarBox).not.toBeNull();

    if (toolbarBox) {
      // Check that toolbar is positioned near the top
      expect(toolbarBox.y).toBeLessThan(100);

      // Check that toolbar is horizontally centered
      const pageWidth = await page.evaluate(() => window.innerWidth);
      const toolbarCenter = toolbarBox.x + toolbarBox.width / 2;
      expect(Math.abs(toolbarCenter - pageWidth / 2)).toBeLessThan(50); // Allow some margin of error
    }

    // Add a node to the canvas
    await page.getByRole('button', { name: /add node/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/title/i).fill('Test Node');
    await dialog.getByLabel(/content/i).fill('This is a test node');
    await dialog.getByRole('button', { name: /save/i }).click();

    // Verify node is visible
    await expect(page.getByText('Test Node')).toBeVisible();

    // Open chat panel
    await page.getByRole('button', { name: /chat/i }).click();

    // Verify chat panel is visible and doesn't overlap with the canvas
    const chatPanel = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatPanel).toBeVisible();

    // Get chat panel position
    const chatPanelBox = await chatPanel.boundingBox();
    expect(chatPanelBox).not.toBeNull();

    // Get canvas position
    const canvasBox = await page.locator('.react-flow').boundingBox();
    expect(canvasBox).not.toBeNull();

    if (chatPanelBox && canvasBox) {
      // Check that chat panel doesn't overlap with the canvas
      // In our design, chat panel should be on the right side
      expect(chatPanelBox.x).toBeGreaterThanOrEqual(canvasBox.x);
    }
  });

  test('should have responsive chat panel that works correctly', async ({ page }) => {
    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Open chat panel
    await page.getByRole('button', { name: /chat/i }).click();

    // Verify chat panel header is visible
    const chatHeader = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatHeader).toBeVisible();

    // Verify chat input is visible
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeVisible();

    // Type a message in the chat
    await chatInput.fill('Hello, this is a test message');

    // Send the message
    await page.getByRole('button', { name: /send/i }).click();

    // Verify message appears in the chat
    // Note: This might fail if the chat service is not properly mocked
    // In a real test environment, we would mock the chat service
    await expect(page.getByText('Hello, this is a test message')).toBeVisible();

    // Close the chat panel
    await page.getByRole('button', { name: /close/i }).click();

    // Verify chat panel is no longer visible
    await expect(chatHeader).not.toBeVisible();
  });

  test('should have properly positioned toolbar with working controls', async ({ page }) => {
    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Verify toolbar is visible
    const toolbar = page
      .locator('div')
      .filter({ hasText: /zoom in/i })
      .first();
    await expect(toolbar).toBeVisible();

    // Get initial zoom level
    const initialZoom = await page.evaluate(() => {
      // Access the zoom level from the ReactFlow instance
      // This is a simplified approach and might need adjustment based on how zoom is stored
      const reactFlowViewport = document.querySelector('.react-flow__viewport');
      if (reactFlowViewport) {
        const transform = reactFlowViewport.getAttribute('transform');
        if (transform) {
          const match = transform.match(/scale\\(([\\d.]+)\\)/);
          return match ? parseFloat(match[1]) : 1;
        }
      }
      return 1;
    });

    // Click zoom in button
    await page.getByRole('button', { name: /zoom in/i }).click();

    // Wait for zoom animation to complete
    await page.waitForTimeout(300);

    // Get new zoom level
    const newZoom = await page.evaluate(() => {
      const reactFlowViewport = document.querySelector('.react-flow__viewport');
      if (reactFlowViewport) {
        const transform = reactFlowViewport.getAttribute('transform');
        if (transform) {
          const match = transform.match(/scale\\(([\\d.]+)\\)/);
          return match ? parseFloat(match[1]) : 1;
        }
      }
      return 1;
    });

    // Verify zoom level has increased
    expect(newZoom).toBeGreaterThan(initialZoom);

    // Click zoom out button
    await page.getByRole('button', { name: /zoom out/i }).click();

    // Wait for zoom animation to complete
    await page.waitForTimeout(300);

    // Get final zoom level
    const finalZoom = await page.evaluate(() => {
      const reactFlowViewport = document.querySelector('.react-flow__viewport');
      if (reactFlowViewport) {
        const transform = reactFlowViewport.getAttribute('transform');
        if (transform) {
          const match = transform.match(/scale\\(([\\d.]+)\\)/);
          return match ? parseFloat(match[1]) : 1;
        }
      }
      return 1;
    });

    // Verify zoom level has decreased
    expect(finalZoom).toBeLessThan(newZoom);
  });

  test('should have proper z-index management with no overlapping elements', async ({ page }) => {
    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Add a node to the canvas
    await page.getByRole('button', { name: /add node/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/title/i).fill('Test Node');
    await dialog.getByLabel(/content/i).fill('This is a test node');
    await dialog.getByRole('button', { name: /save/i }).click();

    // Open chat panel
    await page.getByRole('button', { name: /chat/i }).click();

    // Verify chat panel is visible
    const chatPanel = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatPanel).toBeVisible();

    // Click on the node to open node edit dialog
    await page.getByText('Test Node').click();

    // Verify node edit dialog is visible and on top of other elements
    const nodeEditDialog = page.getByRole('dialog');
    await expect(nodeEditDialog).toBeVisible();

    // Get z-index of dialog and chat panel
    const dialogZIndex = await nodeEditDialog.evaluate(el => {
      return parseInt(window.getComputedStyle(el).zIndex, 10);
    });

    const chatPanelZIndex = await chatPanel.evaluate(el => {
      return parseInt(window.getComputedStyle(el).zIndex, 10);
    });

    // Verify dialog has higher z-index than chat panel
    expect(dialogZIndex).toBeGreaterThan(chatPanelZIndex);

    // Close the dialog
    await nodeEditDialog.getByRole('button', { name: /cancel/i }).click();

    // Verify dialog is closed
    await expect(nodeEditDialog).not.toBeVisible();

    // Verify chat panel is still visible
    await expect(chatPanel).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await page.goto('/');

    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Verify mobile controls are visible
    const mobileControls = page
      .locator('div')
      .filter({ hasText: /zoom in/i })
      .first();
    await expect(mobileControls).toBeVisible();

    // Get mobile controls position
    const mobileControlsBox = await mobileControls.boundingBox();
    expect(mobileControlsBox).not.toBeNull();

    if (mobileControlsBox) {
      // Check that mobile controls are positioned at the bottom
      const pageHeight = await page.evaluate(() => window.innerHeight);
      expect(mobileControlsBox.y + mobileControlsBox.height).toBeGreaterThan(pageHeight - 100);

      // Check that mobile controls are horizontally centered
      const pageWidth = await page.evaluate(() => window.innerWidth);
      const controlsCenter = mobileControlsBox.x + mobileControlsBox.width / 2;
      expect(Math.abs(controlsCenter - pageWidth / 2)).toBeLessThan(50); // Allow some margin of error
    }

    // Add a node to the canvas
    await page.getByRole('button', { name: /add node/i }).click();

    // Verify node dialog is properly sized for mobile
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).not.toBeNull();

    if (dialogBox) {
      // Check that dialog width is appropriate for mobile screen
      const pageWidth = await page.evaluate(() => window.innerWidth);
      expect(dialogBox.width).toBeLessThanOrEqual(pageWidth);
      expect(dialogBox.width).toBeGreaterThan(pageWidth * 0.7); // Dialog should take up most of the screen width
    }

    // Fill in the node details
    await dialog.getByLabel(/title/i).fill('Mobile Test Node');
    await dialog.getByLabel(/content/i).fill('This is a test node on mobile');
    await dialog.getByRole('button', { name: /save/i }).click();

    // Verify node is visible
    await expect(page.getByText('Mobile Test Node')).toBeVisible();

    // Open chat panel on mobile
    await page.getByRole('button', { name: /chat/i }).click();

    // Verify chat panel takes up most of the screen on mobile
    const chatPanel = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatPanel).toBeVisible();

    const chatPanelBox = await chatPanel.boundingBox();
    expect(chatPanelBox).not.toBeNull();

    if (chatPanelBox) {
      // Check that chat panel width is appropriate for mobile screen
      const pageWidth = await page.evaluate(() => window.innerWidth);
      expect(chatPanelBox.width).toBeGreaterThan(pageWidth * 0.7); // Chat panel should take up most of the screen width
    }
  });
});
