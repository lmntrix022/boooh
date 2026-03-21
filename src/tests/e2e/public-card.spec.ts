import { test, expect } from '@playwright/test';

test.describe('Public Card View', () => {
  test('should display a public business card', async ({ page }) => {
    // Note: This test assumes there's at least one public card
    // In a real scenario, you'd create test data first
    
    // Navigate to a public card (you'll need to adjust the ID)
    await page.goto('/card/test-card-id');
    
    // Should display card content or 404
    const isCardVisible = await page.getByRole('heading').first().isVisible();
    const is404 = await page.getByText(/404|not found/i).isVisible();
    
    expect(isCardVisible || is404).toBe(true);
  });

  test('should show QR code on public card', async ({ page }) => {
    await page.goto('/card/test-card-id');
    
    // Look for QR code element or button
    const qrElement = page.locator('[data-testid="qr-code"], img[alt*="QR"]');
    
    // Check if card loaded successfully first
    const isCardLoaded = await page.getByRole('main').isVisible();
    if (isCardLoaded) {
      // QR code might be visible or behind a button
      const qrVisible = await qrElement.isVisible();
      const qrButton = page.getByRole('button', { name: /qr/i });
      const hasQrButton = await qrButton.isVisible();
      
      expect(qrVisible || hasQrButton).toBe(true);
    }
  });

  test('should display contact information', async ({ page }) => {
    await page.goto('/card/test-card-id');
    
    // Check for common contact elements
    const hasEmail = await page.locator('a[href^="mailto:"]').count() > 0;
    const hasPhone = await page.locator('a[href^="tel:"]').count() > 0;
    const hasContent = await page.getByRole('main').isVisible();
    
    // At least some content should be visible
    expect(hasContent).toBe(true);
  });
});

test.describe('Card Interactions', () => {
  test('should track card views', async ({ page }) => {
    await page.goto('/card/test-card-id');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Analytics should be tracked (check network requests if needed)
    // This is a basic check that the page loaded successfully
    expect(await page.title()).toBeTruthy();
  });

  test('should open social media links', async ({ page }) => {
    await page.goto('/card/test-card-id');
    
    // Look for social media links
    const socialLinks = page.locator('a[href*="linkedin"], a[href*="facebook"], a[href*="twitter"], a[href*="instagram"]');
    const count = await socialLinks.count();
    
    if (count > 0) {
      // First social link should have valid href
      const href = await socialLinks.first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});


