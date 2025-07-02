import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER LOG: ${msg.type()} - ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:8347...');
    await page.goto('http://localhost:8347');
    await page.waitForLoadState('networkidle');

    // Enter player name
    console.log('Entering player name...');
    await page.fill('input[placeholder="Enter your name"]', 'TestUser');

    // Select 2 players
    console.log('Selecting 2 players...');
    await page.click('button:has-text("2 Players")');
    
    // Small delay to ensure selection is registered
    await page.waitForTimeout(500);

    // Create room
    console.log('Creating room...');
    await page.click('button:has-text("Create Room as TestUser")');

    // Wait for navigation to waiting room
    console.log('Waiting for room creation...');
    await page.waitForURL(/\/game\//, { timeout: 10000 });
    
    // Wait for the waiting room to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra time for React to render

    // Get current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Count player slots
    const playerSlots = await page.$$('.border.rounded-lg.p-4');
    console.log(`Number of player slots displayed: ${playerSlots.length}`);

    // Get text content of waiting room
    const waitingRoomText = await page.textContent('.container');
    console.log('Waiting room content:', waitingRoomText);

    // Check for specific UI elements
    const playerElements = await page.$$eval('.border.rounded-lg.p-4', elements => 
      elements.map(el => ({
        text: el.textContent,
        classes: el.className
      }))
    );
    console.log('Player slots details:', JSON.stringify(playerElements, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'waiting-room-screenshot.png', fullPage: true });
    console.log('Screenshot saved as waiting-room-screenshot.png');

    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();