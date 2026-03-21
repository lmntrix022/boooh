# 🧪 Guide de Tests - Bööh

Documentation complète du système de tests unitaires, E2E et CI/CD.

---

## 📋 Table des Matières

1. [Installation](#installation)
2. [Tests Unitaires (Vitest)](#tests-unitaires)
3. [Tests E2E (Playwright)](#tests-e2e)
4. [CI/CD (GitHub Actions)](#cicd)
5. [Bonnes Pratiques](#bonnes-pratiques)
6. [Dépannage](#dépannage)

---

## 🚀 Installation

### Prérequis
- Node.js 20+
- npm ou yarn

### Installation des dépendances de test

```bash
# Installer toutes les dépendances
npm install

# Installer spécifiquement Playwright
npm run playwright:install
```

---

## 🔬 Tests Unitaires

### Configuration

**Fichier**: `vitest.config.ts`

- **Framework**: Vitest
- **Environnement**: jsdom (pour React)
- **Coverage**: v8
- **Setup**: `src/tests/setup.ts`

### Structure des Tests

```
src/tests/
├── setup.ts                    # Configuration globale
├── utils/
│   └── test-utils.tsx          # Helpers de test
├── mocks/
│   └── supabase.ts             # Mocks Supabase
└── unit/
    ├── components/             # Tests de composants
    ├── services/               # Tests de services
    └── utils/                  # Tests d'utilitaires
```

### Commandes

```bash
# Lancer tous les tests
npm test

# Lancer tests en mode watch
npm run test:watch

# Lancer tests unitaires uniquement
npm run test:unit

# Générer le rapport de coverage
npm run test:coverage
```

### Exemple de Test Unitaire

**services/mobileMoneyService.test.ts:**

```typescript
import { describe, it, expect } from 'vitest';
import { MobileMoneyService } from '@/services/mobileMoneyService';

describe('MobileMoneyService', () => {
  describe('detectPaymentSystem', () => {
    it('should detect Airtel Money', () => {
      expect(MobileMoneyService.detectPaymentSystem('07123456'))
        .toBe('airtelmoney');
    });

    it('should detect Moov Money', () => {
      expect(MobileMoneyService.detectPaymentSystem('06123456'))
        .toBe('moovmoney4');
    });
  });
});
```

**components/Button.test.tsx:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/tests/utils/test-utils';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Coverage Requirements

**Seuils actuels** (définis dans `vitest.config.ts`):
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

**Objectif**: 80%+ pour les fichiers critiques

### Fichiers à Tester en Priorité

1. **Services critiques**:
   - `mobileMoneyService.ts` ✅
   - `authService.ts`
   - `paymentCallbackService.ts`
   - `digitalProductService.ts`

2. **Composants UI essentiels**:
   - `Button` ✅
   - `Form components`
   - `Modal components`

3. **Utilitaires**:
   - `formatAmount` ✅
   - `validateAmount` ✅
   - Validation functions

---

## 🎭 Tests E2E

### Configuration

**Fichier**: `playwright.config.ts`

- **Framework**: Playwright
- **Navigateurs**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Port**: 8080 (dev server)

### Structure des Tests

```
src/tests/e2e/
├── auth.spec.ts                # Tests d'authentification
├── navigation.spec.ts          # Tests de navigation
├── public-card.spec.ts         # Tests cartes publiques
└── checkout.spec.ts            # Tests paiement (à créer)
```

### Commandes

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Interface graphique
npm run test:e2e:ui

# Mode headed (voir le navigateur)
npm run test:e2e:headed

# Mode debug
npm run test:e2e:debug
```

### Exemple de Test E2E

**auth.spec.ts:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/bööh/i);
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.getByRole('link', { name: /connexion/i });
    await loginButton.click();
    
    await expect(page).toHaveURL(/.*auth/);
  });
});
```

### Scénarios de Test E2E

#### ✅ Implémentés

1. **Authentification**:
   - Affichage de la landing page
   - Navigation vers auth
   - Validation formulaire vide
   - Erreur credentials invalides
   - Switch login/signup

2. **Navigation**:
   - Navigation pages principales
   - Menu mobile
   - Page 404
   - Toggle thème

3. **Cartes Publiques**:
   - Affichage carte publique
   - QR code
   - Informations de contact

#### 🔜 À Implémenter

4. **Checkout & Paiement**:
   - Ajout au panier
   - Processus de checkout
   - Paiement Mobile Money
   - Confirmation commande

5. **Dashboard**:
   - Création de carte
   - Modification de carte
   - Upload d'images

6. **CRM**:
   - Scanner de carte
   - Création contact
   - Gestion pipeline

---

## 🔄 CI/CD

### GitHub Actions Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Déclencheurs**:
- Push sur `main` ou `develop`
- Pull Requests

**Jobs**:

1. **Lint & Type Check**
   - ESLint
   - TypeScript compilation

2. **Unit Tests**
   - Vitest
   - Coverage report
   - Upload Codecov

3. **E2E Tests**
   - Playwright (Chromium only in CI)
   - Upload reports

4. **Build**
   - Production build
   - Size analysis
   - Artifacts upload

5. **Lighthouse** (PR only)
   - Performance audit

6. **Security Audit**
   - npm audit

7. **Deploy Preview** (PR only)
   - Preview deployment

#### 2. Production Deployment (`.github/workflows/deploy-production.yml`)

**Déclencheurs**:
- Push sur `main`
- Tags `v*`
- Manuel (`workflow_dispatch`)

**Jobs**:

1. **Test & Build**
   - Tests complets
   - Production build

2. **Deploy Production**
   - Déploiement
   - Health check

3. **Notifications**
   - Status notifications

### Variables d'Environnement GitHub

**À configurer dans Settings → Secrets**:

```
CODECOV_TOKEN             # Pour upload coverage
LHCI_GITHUB_APP_TOKEN    # Pour Lighthouse CI
```

### Badges de Status

Ajoutez à votre README.md :

```markdown
![CI](https://github.com/YOUR_USERNAME/boooh-main/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://github.com/YOUR_USERNAME/boooh-main/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/boooh-main/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/boooh-main)
```

---

## ✅ Bonnes Pratiques

### Tests Unitaires

1. **Nommage**:
   ```typescript
   describe('ComponentName', () => {
     it('should do something when condition', () => {});
   });
   ```

2. **AAA Pattern**:
   ```typescript
   it('should increment counter', () => {
     // Arrange
     const counter = 0;
     
     // Act
     const result = increment(counter);
     
     // Assert
     expect(result).toBe(1);
   });
   ```

3. **Isolation**:
   - Utiliser des mocks pour les dépendances externes
   - Nettoyer après chaque test (afterEach)

4. **Coverage**:
   - Tester les cas limites
   - Tester les erreurs
   - Ne pas viser 100% bêtement

### Tests E2E

1. **Stabilité**:
   ```typescript
   // ❌ Mauvais
   await page.waitForTimeout(3000);
   
   // ✅ Bon
   await page.waitForSelector('.element');
   await expect(element).toBeVisible();
   ```

2. **Sélecteurs**:
   ```typescript
   // ❌ Fragile
   await page.click('.btn-primary');
   
   // ✅ Robuste
   await page.getByRole('button', { name: /connexion/i }).click();
   ```

3. **Données de test**:
   - Utiliser des données dédiées
   - Nettoyer après les tests
   - Isoler les tests

### CI/CD

1. **Cache**:
   - Utiliser le cache npm/yarn
   - Cache Playwright browsers

2. **Parallélisation**:
   - Jobs indépendants en parallèle
   - Tests E2E groupés

3. **Artifacts**:
   - Conserver les rapports
   - Retention limitée (7-30 jours)

---

## 🐛 Dépannage

### Tests Unitaires

#### Erreur: "Cannot find module '@/...'"

**Solution**: Vérifier `vitest.config.ts` alias:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

#### Tests lents

**Solutions**:
- Réduire le nombre de tests en mode watch
- Utiliser `.only` pour tester un seul test
- Désactiver le coverage en développement

### Tests E2E

#### Erreur: "Failed to launch browser"

**Solution**:
```bash
npm run playwright:install
```

#### Tests flaky (instables)

**Solutions**:
- Augmenter les timeouts
- Utiliser `waitForLoadState('networkidle')`
- Éviter les `waitForTimeout`

#### Erreur: "Target closed"

**Solution**: Le serveur dev n'est pas démarré
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### CI/CD

#### Build qui échoue en CI mais passe en local

**Causes courantes**:
- Variables d'environnement manquantes
- Cache npm corrompu
- Différence de versions Node

**Solutions**:
- Vérifier les secrets GitHub
- Clear cache: `actions/cache@v3` avec clé unique
- Fixer la version Node dans workflow

#### Tests E2E qui timeout

**Solution**: Augmenter le timeout dans `playwright.config.ts`:

```typescript
webServer: {
  timeout: 120 * 1000, // 2 minutes
},
```

---

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [GitHub Actions](https://docs.github.com/actions)

---

**Dernière mise à jour**: Octobre 2024  
**Responsable**: Équipe Dev Bööh


