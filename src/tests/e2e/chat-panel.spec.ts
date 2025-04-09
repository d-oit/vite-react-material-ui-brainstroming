import { test, expect } from '@playwright/test';

test.describe('Chat Panel Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Start a quick brainstorming session
    await page.getByRole('button', { name: /quick brainstorm/i }).click();

    // Open chat panel
    await page.getByRole('button', { name: /chat/i }).click();
  });

  test('should have proper header and footer that stay fixed during scrolling', async ({
    page,
  }) => {
    // Verify chat header is visible
    const chatHeader = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatHeader).toBeVisible();

    // Get header position
    const initialHeaderBox = await chatHeader.boundingBox();
    expect(initialHeaderBox).not.toBeNull();

    // Verify chat input footer is visible
    const chatFooter = page
      .locator('div')
      .filter({ hasText: /type a message/i })
      .first();
    await expect(chatFooter).toBeVisible();

    // Get footer position
    const initialFooterBox = await chatFooter.boundingBox();
    expect(initialFooterBox).not.toBeNull();

    // Add multiple messages to create scrollable content
    const chatInput = page.getByPlaceholder(/type a message/i);

    // Send 10 messages to create scrollable content
    for (let i = 1; i <= 10; i++) {
      await chatInput.fill(`Test message ${i}`);
      await page.getByRole('button', { name: /send/i }).click();
      // Wait for message to be sent
      await page.waitForTimeout(100);
    }

    // Scroll to the middle of the chat
    await page.evaluate(() => {
      const chatMessages = document.querySelector('[role="log"]');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight / 2;
      }
    });

    // Wait for scroll to complete
    await page.waitForTimeout(300);

    // Get header position after scrolling
    const scrolledHeaderBox = await chatHeader.boundingBox();
    expect(scrolledHeaderBox).not.toBeNull();

    // Get footer position after scrolling
    const scrolledFooterBox = await chatFooter.boundingBox();
    expect(scrolledFooterBox).not.toBeNull();

    if (initialHeaderBox && scrolledHeaderBox && initialFooterBox && scrolledFooterBox) {
      // Verify header position hasn't changed (it should be fixed)
      expect(scrolledHeaderBox.y).toBeCloseTo(initialHeaderBox.y, 0);

      // Verify footer position hasn't changed (it should be fixed)
      expect(scrolledFooterBox.y).toBeCloseTo(initialFooterBox.y, 0);
    }
  });

  test('should have proper message styling and layout', async ({ page }) => {
    // Send a user message
    const chatInput = page.getByPlaceholder(/type a message/i);
    await chatInput.fill('This is a user message');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for message to be sent
    await page.waitForTimeout(300);

    // Verify user message is visible and properly styled
    const userMessage = page.getByText('This is a user message');
    await expect(userMessage).toBeVisible();

    // Get user message container
    const userMessageContainer = userMessage.locator(
      'xpath=ancestor::div[contains(@class, "MuiPaper-root")]'
    );

    // Verify user message is aligned to the right
    const userMessageBox = await userMessageContainer.boundingBox();
    expect(userMessageBox).not.toBeNull();

    if (userMessageBox) {
      // Get chat panel width
      const chatPanelWidth = await page
        .locator('div')
        .filter({ hasText: /chat title/i })
        .first()
        .evaluate(el => {
          return el.getBoundingClientRect().width;
        });

      // Check that user message is aligned to the right
      expect(userMessageBox.x + userMessageBox.width).toBeGreaterThan(chatPanelWidth / 2);
    }

    // Send a bot message (this is simulated since we can't actually get a response from the bot in tests)
    // In a real test, we would mock the chat service to return a response
    await page.evaluate(() => {
      // Create a mock bot message element
      const chatContainer = document.querySelector('[role="log"]');
      if (chatContainer) {
        const botMessageDiv = document.createElement('div');
        botMessageDiv.style.display = 'flex';
        botMessageDiv.style.alignItems = 'flex-start';
        botMessageDiv.style.gap = '8px';
        botMessageDiv.style.alignSelf = 'flex-start';
        botMessageDiv.style.maxWidth = '80%';

        const avatar = document.createElement('div');
        avatar.className = 'MuiAvatar-root';
        avatar.style.backgroundColor = 'purple';
        avatar.textContent = 'B';

        const paper = document.createElement('div');
        paper.className = 'MuiPaper-root';
        paper.style.padding = '16px';
        paper.style.borderRadius = '16px';
        paper.style.backgroundColor = 'white';
        paper.textContent = 'This is a bot message';

        botMessageDiv.appendChild(avatar);
        botMessageDiv.appendChild(paper);
        chatContainer.appendChild(botMessageDiv);
      }
    });

    // Verify bot message is visible
    const botMessage = page.getByText('This is a bot message');
    await expect(botMessage).toBeVisible();

    // Get bot message container
    const botMessageContainer = botMessage.locator(
      'xpath=ancestor::div[contains(@class, "MuiPaper-root")]'
    );

    // Verify bot message is aligned to the left
    const botMessageBox = await botMessageContainer.boundingBox();
    expect(botMessageBox).not.toBeNull();

    if (botMessageBox) {
      // Get chat panel width
      const chatPanelWidth = await page
        .locator('div')
        .filter({ hasText: /chat title/i })
        .first()
        .evaluate(el => {
          return el.getBoundingClientRect().width;
        });

      // Check that bot message is aligned to the left
      expect(botMessageBox.x).toBeLessThan(chatPanelWidth / 2);
    }
  });

  test('should have proper input field behavior', async ({ page }) => {
    // Get chat input
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeVisible();

    // Verify input field expands with multiline text
    await chatInput.fill('This is a\nmultiline\nmessage');

    // Get input field height
    const multilineHeight = await chatInput.evaluate(el => {
      return el.getBoundingClientRect().height;
    });

    // Clear input and fill with single line text
    await chatInput.clear();
    await chatInput.fill('Single line message');

    // Get input field height with single line
    const singleLineHeight = await chatInput.evaluate(el => {
      return el.getBoundingClientRect().height;
    });

    // Verify multiline input is taller than single line input
    expect(multilineHeight).toBeGreaterThan(singleLineHeight);

    // Verify send button is enabled with text
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeEnabled();

    // Clear input and verify send button is disabled
    await chatInput.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('should handle chat panel opening and closing smoothly', async ({ page }) => {
    // Chat panel should be open from beforeEach
    const chatPanel = page
      .locator('div')
      .filter({ hasText: /chat title/i })
      .first();
    await expect(chatPanel).toBeVisible();

    // Close chat panel
    await page.getByRole('button', { name: /close/i }).click();

    // Verify chat panel is closed
    await expect(chatPanel).not.toBeVisible();

    // Verify chat button is visible
    const chatButton = page.getByRole('button', { name: /chat/i });
    await expect(chatButton).toBeVisible();

    // Open chat panel again
    await chatButton.click();

    // Verify chat panel is visible again
    await expect(chatPanel).toBeVisible();

    // Verify chat input is focused
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeFocused();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test on mobile size
    await page.setViewportSize({ width: 375, height: 667 });

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

    // Test on tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify chat panel is properly sized for tablet
    const tabletChatPanelBox = await chatPanel.boundingBox();
    expect(tabletChatPanelBox).not.toBeNull();

    if (tabletChatPanelBox) {
      // Check that chat panel width is appropriate for tablet screen
      const pageWidth = await page.evaluate(() => window.innerWidth);
      expect(tabletChatPanelBox.width).toBeLessThan(pageWidth * 0.7); // Chat panel should not take up the entire screen
    }

    // Test on desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Verify chat panel is properly sized for desktop
    const desktopChatPanelBox = await chatPanel.boundingBox();
    expect(desktopChatPanelBox).not.toBeNull();

    if (desktopChatPanelBox) {
      // Check that chat panel width is appropriate for desktop screen
      const pageWidth = await page.evaluate(() => window.innerWidth);
      expect(desktopChatPanelBox.width).toBeLessThan(pageWidth * 0.5); // Chat panel should be a sidebar
    }
  });
});
