import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main pages', async ({ page }) => {
    await page.goto('/');
    
    // Check landing page loads
    await expect(page).toHaveTitle(/bööh/i);
    
    // Navigate to pricing if available
    const pricingLink = page.getByRole('link', { name: /tarifs|pricing/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/.*pricing/);
    }
    
    // Navigate to contact if available
    await page.goto('/');
    const contactLink = page.getByRole('link', { name: /contact/i });
    if (await contactLink.isVisible()) {
      await contactLink.click();
      await expect(page).toHaveURL(/.*contact/);
    }
  });

  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/');
    
    // Look for mobile menu button
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Menu should be visible
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('should handle 404 for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    
    // Should show 404 page or redirect
    await expect(
      page.getByText(/404|page.*trouv|not found/i)
    ).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark theme', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeButton = page.getByRole('button', { name: /theme|thème/i });
    
    if (await themeButton.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('class');
      
      // Toggle theme
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Theme should have changed
      const newTheme = await htmlElement.getAttribute('class');
      expect(initialTheme).not.toBe(newTheme);
    }
  });
});


