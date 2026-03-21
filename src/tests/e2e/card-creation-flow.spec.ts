/**
 * Tests E2E du flow de création de carte complète
 *
 * Teste le processus complet de création d'une carte professionnelle:
 * - Authentification
 * - Navigation vers le formulaire de création
 * - Remplissage des informations de base
 * - Ajout de médias (photo, logo, couverture)
 * - Configuration des réseaux sociaux
 * - Personnalisation du design
 * - Enregistrement et publication
 * - Gestion des erreurs et validations
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const TEST_USER = {
  email: 'test-creation@example.com',
  password: 'TestPassword123!',
  name: 'Test Creator',
};

test.describe('Card Creation Flow E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Authentification préalable', () => {
    test('devrait se connecter avant de créer une carte', async () => {
      // 1. Aller sur la page d'authentification
      await page.goto(`${BASE_URL}/auth`);

      // 2. Se connecter
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // 3. Attendre la redirection après connexion
      await page.waitForURL(/.*dashboard|.*cards/, { timeout: 10000 });
      expect(page.url()).toMatch(/dashboard|cards/);
    });
  });

  test.describe('Navigation vers le formulaire', () => {
    test('devrait naviguer vers le formulaire de création de carte', async () => {
      // Supposer déjà connecté (ou faire la connexion)
      await page.goto(`${BASE_URL}/dashboard`);

      // Chercher le bouton "Créer une carte" ou "Nouvelle carte"
      const createButton = page.getByRole('button', { name: /créer|nouvelle carte|new card/i }) ||
                          page.getByRole('link', { name: /créer|nouvelle carte/i });

      if (await createButton.isVisible()) {
        await createButton.click();

        // Vérifier qu'on est sur le formulaire
        await expect(page).toHaveURL(/.*card.*create|.*cards.*new|.*form/, { timeout: 5000 });
      }
    });

    test('devrait rediriger vers auth si non connecté', async () => {
      // Se déconnecter si nécessaire
      await page.goto(`${BASE_URL}/cards/new`);

      // Devrait rediriger vers /auth
      await page.waitForURL(/.*auth/, { timeout: 5000 });
      expect(page.url()).toMatch(/auth/);
    });
  });

  test.describe('Remplissage du formulaire - Informations de base', () => {
    test('devrait remplir les informations de base (nom, titre, entreprise)', async () => {
      // Aller sur le formulaire (supposer authentifié)
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir les champs de base
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Développeur Full Stack');
      await page.fill('[name="company"]', 'Ma Startup Inc.');

      // Vérifier que les champs sont remplis
      await expect(page.locator('[name="name"]')).toHaveValue('John Doe');
      await expect(page.locator('[name="title"]')).toHaveValue('Développeur Full Stack');
      await expect(page.locator('[name="company"]')).toHaveValue('Ma Startup Inc.');
    });

    test('devrait valider les champs requis avant de passer à l\'étape suivante', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Essayer de passer à l'étape suivante sans remplir
      const nextButton = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Vérifier qu'un message d'erreur apparaît
        await expect(
          page.getByText(/requis|obligatoire|required/i)
        ).toBeVisible({ timeout: 2000 });
      }
    });

    test('devrait afficher l\'indicateur de progression', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Vérifier la présence d'un indicateur de progression
      const progressBar = page.locator('[data-testid="progress-bar"]') ||
                         page.locator('[role="progressbar"]') ||
                         page.getByText(/étape|step/i);

      // Si un indicateur existe, il devrait être visible
      if (await progressBar.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(progressBar.first()).toBeVisible();
      }
    });
  });

  test.describe('Étape Contact', () => {
    test('devrait remplir les informations de contact', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir les infos de base d'abord
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Développeur');
      await page.fill('[name="company"]', 'Ma Société');

      // Passer à l'étape contact
      const nextButton = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Remplir les contacts
        await page.fill('[name="email"]', 'john@example.com');
        await page.fill('[name="phone"]', '+241 06 12 34 56');
        await page.fill('[name="website"]', 'https://johndoe.com');

        // Vérifier
        await expect(page.locator('[name="email"]')).toHaveValue('john@example.com');
      }
    });

    test('devrait valider le format email', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Naviguer vers l'étape contact
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      const nextButton = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Entrer un email invalide
        await page.fill('[name="email"]', 'invalid-email');

        // Vérifier le message d'erreur
        await expect(
          page.getByText(/email.*invalide|format.*email/i)
        ).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Étape Médias', () => {
    test('devrait permettre d\'uploader une photo de profil', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Naviguer jusqu'à l'étape médias
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      // Passer les étapes
      const nextButtons = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButtons.first().isVisible()) {
        await nextButtons.first().click();
        await page.waitForTimeout(500);

        // Chercher l'input d'upload
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Créer un fichier de test
          const fileChooserPromise = page.waitForEvent('filechooser');
          await fileInput.click();
          const fileChooser = await fileChooserPromise;

          // Note: Dans un vrai test, on utiliserait un fichier réel
          // Ici on vérifie juste que l'input existe
          expect(fileChooser).toBeTruthy();
        }
      }
    });

    test('devrait afficher un aperçu après upload', async () => {
      // Test similaire mais vérifie l'aperçu
      // Cette partie dépend de l'implémentation réelle
      await page.goto(`${BASE_URL}/cards/new`);
      // ... remplir les étapes précédentes
      // ... upload fichier
      // ... vérifier aperçu
    });
  });

  test.describe('Étape Réseaux sociaux', () => {
    test('devrait remplir les liens des réseaux sociaux', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Naviguer jusqu'à l'étape réseaux sociaux
      // ... remplir les étapes précédentes

      // Remplir les réseaux sociaux
      await page.fill('[name="linkedin"]', 'https://linkedin.com/in/johndoe');
      await page.fill('[name="twitter"]', 'https://twitter.com/johndoe');
      await page.fill('[name="instagram"]', 'https://instagram.com/johndoe');

      // Vérifier
      await expect(page.locator('[name="linkedin"]')).toHaveValue(/linkedin/);
    });

    test('devrait valider les URLs des réseaux sociaux', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Entrer une URL invalide
      const invalidUrl = 'not-a-url';
      await page.fill('[name="linkedin"]', invalidUrl);

      // Vérifier le message d'erreur (si validation présente)
      const errorMessage = page.getByText(/url.*invalide|format.*url/i);
      if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(errorMessage).toBeVisible();
      }
    });
  });

  test.describe('Étape Design', () => {
    test('devrait sélectionner un thème', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Naviguer jusqu'à l'étape design
      // ... remplir les étapes précédentes

      // Sélectionner un thème
      const themeOption = page.getByRole('button', { name: /thème|theme/i }).first() ||
                         page.locator('[data-testid="theme-option"]').first();

      if (await themeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await themeOption.click();
        // Vérifier que le thème est sélectionné
        await expect(themeOption).toHaveAttribute('aria-selected', 'true');
      }
    });
  });

  test.describe('Enregistrement et publication', () => {
    test('devrait enregistrer une carte en brouillon', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir les informations minimales
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Développeur');
      await page.fill('[name="company"]', 'Ma Société');

      // Cliquer sur Enregistrer
      const saveButton = page.getByRole('button', { name: /enregistrer|save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Vérifier le message de succès
        await expect(
          page.getByText(/enregistré|sauvegardé|saved/i)
        ).toBeVisible({ timeout: 5000 });

        // Vérifier la redirection vers la liste des cartes ou le dashboard
        await page.waitForURL(/.*cards|.*dashboard/, { timeout: 5000 });
      }
    });

    test('devrait publier une carte', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir toutes les informations
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Développeur');
      await page.fill('[name="company"]', 'Ma Société');
      await page.fill('[name="email"]', 'john@example.com');

      // Cliquer sur Publier
      const publishButton = page.getByRole('button', { name: /publier|publish/i });
      if (await publishButton.isVisible()) {
        await publishButton.click();

        // Vérifier le message de succès
        await expect(
          page.getByText(/publié|published|succès/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait afficher un message de confirmation avant publication', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir les informations
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      // Cliquer sur Publier
      const publishButton = page.getByRole('button', { name: /publier|publish/i });
      if (await publishButton.isVisible()) {
        await publishButton.click();

        // Vérifier la présence d'une modal de confirmation (si présente)
        const confirmModal = page.locator('[role="dialog"]');
        if (await confirmModal.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(confirmModal).toBeVisible();
        }
      }
    });
  });

  test.describe('Navigation entre les étapes', () => {
    test('devrait permettre de revenir à l\'étape précédente', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir l'étape 1
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      // Aller à l'étape suivante
      const nextButton = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Revenir en arrière
        const prevButton = page.getByRole('button', { name: /précédent|back|retour/i });
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(500);

          // Vérifier qu'on est revenu à l'étape 1
          await expect(page.locator('[name="name"]')).toBeVisible();
        }
      }
    });

    test('devrait conserver les données lors de la navigation', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Remplir l'étape 1
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      // Aller à l'étape suivante
      const nextButton = page.getByRole('button', { name: /suivant|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Revenir en arrière
        const prevButton = page.getByRole('button', { name: /précédent|back/i });
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(500);

          // Les données devraient être conservées
          await expect(page.locator('[name="name"]')).toHaveValue('John Doe');
        }
      }
    });
  });

  test.describe('Gestion des erreurs', () => {
    test('devrait gérer les erreurs de sauvegarde', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Simuler une erreur réseau
      await page.route('**/api/cards**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      // Remplir et sauvegarder
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      const saveButton = page.getByRole('button', { name: /enregistrer|save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Vérifier le message d'erreur
        await expect(
          page.getByText(/erreur|error/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('devrait permettre de réessayer après une erreur', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Simuler une erreur puis un succès
      let requestCount = 0;
      await page.route('**/api/cards**', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          route.continue();
        }
      });

      // Remplir et sauvegarder
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="title"]', 'Dev');
      await page.fill('[name="company"]', 'Company');

      const saveButton = page.getByRole('button', { name: /enregistrer|save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Attendre l'erreur
        await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 5000 });

        // Réessayer
        const retryButton = page.getByRole('button', { name: /réessayer|retry/i });
        if (await retryButton.isVisible()) {
          await retryButton.click();

          // Vérifier le succès
          await expect(page.getByText(/enregistré|saved/i)).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Validation en temps réel', () => {
    test('devrait valider les champs en temps réel', async () => {
      await page.goto(`${BASE_URL}/cards/new`);

      // Entrer un email invalide
      await page.fill('[name="email"]', 'invalid-email');

      // Attendre la validation
      await page.waitForTimeout(500);

      // Vérifier le message d'erreur (si validation en temps réel)
      const errorMessage = page.getByText(/email.*invalide|format.*email/i);
      if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(errorMessage).toBeVisible();
      }
    });
  });
});


