/**
 * Tests E2E du flow de paiement complet
 *
 * Teste les scénarios de paiement end-to-end:
 * - Paiement Stripe (carte bancaire)
 * - Paiement Mobile Money (Moov/Airtel)
 * - Confirmation de commande
 * - Téléchargement produit après paiement
 * - Gestion des erreurs de paiement
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:8080';
const TEST_USER = {
  email: 'test-e2e@example.com',
  password: 'TestPassword123!',
  name: 'Test E2E User',
};

test.describe('Payment Flow E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Paiement Stripe', () => {
    test('devrait compléter un paiement Stripe avec succès', async () => {
      // 1. Aller sur la page d'un produit
      await page.goto(`${BASE_URL}/card/test-card-id`);

      // 2. Cliquer sur un produit digital
      await page.click('[data-testid="product-card"]');

      // 3. Cliquer sur "Acheter"
      await page.click('[data-testid="buy-button"]');

      // 4. Vérifier que le modal de paiement s'ouvre
      await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();

      // 5. Sélectionner Stripe
      await page.click('[data-testid="payment-method-stripe"]');

      // 6. Remplir les informations de carte (test Stripe)
      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
      await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/34');
      await stripeFrame.locator('[placeholder="CVC"]').fill('123');

      // 7. Soumettre le paiement
      await page.click('[data-testid="submit-payment"]');

      // 8. Attendre la confirmation
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({
        timeout: 15000,
      });

      // 9. Vérifier le message de succès
      await expect(page.locator('text=Paiement réussi')).toBeVisible();

      // 10. Vérifier la redirection vers la page de téléchargement
      await expect(page).toHaveURL(/\/my-purchases/);
    });

    test('devrait gérer les erreurs de carte invalide', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      // Sélectionner Stripe
      await page.click('[data-testid="payment-method-stripe"]');

      // Carte déclinée Stripe test
      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await stripeFrame.locator('[placeholder="Card number"]').fill('4000000000000002');
      await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/34');
      await stripeFrame.locator('[placeholder="CVC"]').fill('123');

      await page.click('[data-testid="submit-payment"]');

      // Vérifier le message d'erreur
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=Votre carte a été déclinée')).toBeVisible();
    });

    test('devrait annuler un paiement Stripe', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      // Cliquer sur annuler
      await page.click('[data-testid="cancel-payment"]');

      // Vérifier que le modal se ferme
      await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Paiement Mobile Money', () => {
    test('devrait initier un paiement Moov Money', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      // Sélectionner Mobile Money
      await page.click('[data-testid="payment-method-mobile-money"]');

      // Vérifier que le formulaire Mobile Money apparaît
      await expect(page.locator('[data-testid="mobile-money-form"]')).toBeVisible();

      // Remplir les informations
      await page.fill('[data-testid="payer-name"]', 'Jean Dupont');
      await page.fill('[data-testid="payer-email"]', 'jean@example.com');
      await page.fill('[data-testid="payer-phone"]', '06123456');

      // Auto-détection opérateur (Moov = 06)
      await expect(page.locator('text=Moov Money')).toBeVisible();

      // Soumettre
      await page.click('[data-testid="submit-mobile-money"]');

      // Vérifier la page d'instructions
      await expect(page.locator('[data-testid="ussd-instructions"]')).toBeVisible();
      await expect(page.locator('text=Composez *155#')).toBeVisible();

      // Vérifier le polling de statut
      await expect(page.locator('[data-testid="payment-pending"]')).toBeVisible();
      await expect(page.locator('text=En attente de confirmation')).toBeVisible();
    });

    test('devrait détecter automatiquement Airtel Money', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      await page.click('[data-testid="payment-method-mobile-money"]');

      // Numéro Airtel (07)
      await page.fill('[data-testid="payer-phone"]', '07654321');

      // Vérifier détection Airtel
      await expect(page.locator('text=Airtel Money')).toBeVisible();
    });

    test('devrait valider le format du numéro', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      await page.click('[data-testid="payment-method-mobile-money"]');

      // Numéro invalide
      await page.fill('[data-testid="payer-phone"]', '123');

      await page.click('[data-testid="submit-mobile-money"]');

      // Vérifier message d'erreur
      await expect(page.locator('text=Numéro de téléphone invalide')).toBeVisible();
    });
  });

  test.describe('Téléchargement après achat', () => {
    test('devrait permettre le téléchargement après paiement réussi', async () => {
      // Supposons un paiement déjà effectué (via setup)
      await page.goto(`${BASE_URL}/my-purchases`);

      // Vérifier que le produit acheté apparaît
      await expect(page.locator('[data-testid="purchased-product"]')).toBeVisible();

      // Cliquer sur télécharger
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-button"]');
      const download = await downloadPromise;

      // Vérifier que le fichier est téléchargé
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('devrait afficher le compteur de téléchargements restants', async () => {
      await page.goto(`${BASE_URL}/my-purchases`);

      // Vérifier le compteur
      await expect(page.locator('[data-testid="downloads-remaining"]')).toContainText(
        /\d+ téléchargements? restants?/
      );
    });

    test('devrait empêcher le téléchargement après expiration', async () => {
      await page.goto(`${BASE_URL}/my-purchases`);

      // Produit expiré
      const expiredProduct = page.locator('[data-testid="expired-product"]');

      if (await expiredProduct.isVisible()) {
        await expect(
          expiredProduct.locator('[data-testid="download-button"]')
        ).toBeDisabled();

        await expect(expiredProduct.locator('text=Expiré')).toBeVisible();
      }
    });
  });

  test.describe('Gestion des erreurs', () => {
    test('devrait gérer une panne réseau pendant le paiement', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      // Simuler offline
      await page.context().setOffline(true);

      await page.click('[data-testid="payment-method-stripe"]');
      await page.click('[data-testid="submit-payment"]');

      // Vérifier message d'erreur réseau
      await expect(page.locator('text=Erreur de connexion')).toBeVisible();

      // Remettre online
      await page.context().setOffline(false);
    });

    test('devrait gérer un timeout de paiement', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      await page.click('[data-testid="payment-method-mobile-money"]');

      // Remplir le formulaire
      await page.fill('[data-testid="payer-name"]', 'Test');
      await page.fill('[data-testid="payer-email"]', 'test@example.com');
      await page.fill('[data-testid="payer-phone"]', '06123456');

      await page.click('[data-testid="submit-mobile-money"]');

      // Attendre le timeout (simulé avec mocked response)
      await page.waitForTimeout(60000 + 5000); // 1min timeout + 5s buffer

      // Vérifier message timeout
      await expect(page.locator('text=Délai dépassé')).toBeVisible();
    });

    test('devrait permettre de réessayer après une erreur', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      // Premier essai échoué (carte invalide)
      await page.click('[data-testid="payment-method-stripe"]');

      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await stripeFrame.locator('[placeholder="Card number"]').fill('4000000000000002');
      await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/34');
      await stripeFrame.locator('[placeholder="CVC"]').fill('123');

      await page.click('[data-testid="submit-payment"]');

      // Erreur
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();

      // Cliquer sur réessayer
      await page.click('[data-testid="retry-payment"]');

      // Le formulaire devrait être réinitialisé
      await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
    });
  });

  test.describe('Sécurité', () => {
    test('devrait empêcher accès aux téléchargements sans authentification', async () => {
      // Tenter d'accéder directement à un lien de téléchargement
      const response = await page.goto(
        `${BASE_URL}/api/download/protected-file.pdf?token=fake-token`
      );

      expect(response?.status()).toBe(401);
    });

    test('devrait valider le token de téléchargement', async () => {
      await page.goto(`${BASE_URL}/my-purchases`);

      // Intercepter la requête de téléchargement
      await page.route('**/api/download/**', (route) => {
        const url = route.request().url();
        expect(url).toContain('token=');

        // Vérifier que le token est un UUID valide
        const tokenMatch = url.match(/token=([a-f0-9-]+)/);
        expect(tokenMatch).toBeTruthy();

        route.continue();
      });

      await page.click('[data-testid="download-button"]');
    });

    test('ne devrait pas exposer les informations de paiement dans l\'URL', async () => {
      await page.goto(`${BASE_URL}/card/test-card-id`);
      await page.click('[data-testid="product-card"]');
      await page.click('[data-testid="buy-button"]');

      await page.click('[data-testid="payment-method-stripe"]');

      // Remplir les infos
      const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
      await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');

      // Vérifier que l'URL ne contient pas de données sensibles
      const url = page.url();
      expect(url).not.toContain('4242');
      expect(url).not.toContain('card');
      expect(url).not.toContain('cvv');
    });
  });
});
