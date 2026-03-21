import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/bööh/i);
    await expect(page.getByRole('heading', { name: /bööh/i })).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    // Look for "Connexion" or "Se connecter" button
    const loginButton = page.getByRole('link', { name: /connexion|se connecter/i });
    await loginButton.click();
    
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit without filling form
    const submitButton = page.getByRole('button', { name: /connexion|se connecter/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/requis|obligatoire/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    const submitButton = page.getByRole('button', { name: /connexion|se connecter/i });
    await submitButton.click();
    
    // Should show error message
    await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible({ timeout: 5000 });
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    await page.goto('/auth');
    
    // Should be on login tab by default
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
    
    // Click on signup tab
    const signupTab = page.getByRole('tab', { name: /inscription|créer un compte/i });
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await expect(page.getByRole('button', { name: /créer|inscription/i })).toBeVisible();
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when accessing dashboard without login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to /auth
    await page.waitForURL(/.*auth/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should redirect to auth when accessing cards without login', async ({ page }) => {
    await page.goto('/cards');
    
    await page.waitForURL(/.*auth/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*auth/);
  });
});


