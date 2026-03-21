# Guide : Support Multi-Cartes pour le Portfolio

## Problème Identifié

Actuellement, le système de portfolio est limité à **UN portfolio par utilisateur** à cause de la contrainte `UNIQUE` sur `user_id` dans la table `portfolio_settings`.

## Solution Implémentée

Permettre à **chaque carte** d'avoir son **propre portfolio indépendant**.

---

## Étapes d'Application

### 1. Appliquer la Migration SQL

La migration a été créée : `/supabase/migrations/20250116_fix_portfolio_multi_cards.sql`

**Pour l'appliquer via Supabase CLI :**

```bash
# Depuis la racine du projet
supabase db push
```

**OU via le Dashboard Supabase :**

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de `20250116_fix_portfolio_multi_cards.sql`
5. Cliquer sur **Run**

### 2. Modifications Apportées par la Migration

#### A. Table `portfolio_settings`
- ✅ Suppression de `UNIQUE` sur `user_id`
- ✅ Suppression de `UNIQUE` sur `card_id`
- ✅ `card_id` devient `NOT NULL` (obligatoire)
- ✅ Ajout de contrainte `UNIQUE (user_id, card_id)` - permet plusieurs portfolios par utilisateur

#### B. Nouvelles Policies RLS
- ✅ Les utilisateurs peuvent créer un portfolio pour chacune de leurs cartes
- ✅ Validation que la carte appartient bien à l'utilisateur lors de la création
- ✅ Le public peut voir les portfolios activés par `card_id`

#### C. Nouvelle Fonction SQL
- ✅ `get_portfolio_stats_by_card(card_uuid)` - Statistiques par carte au lieu de par utilisateur

#### D. Index de Performance
- ✅ Index composite `(user_id, card_id)` pour requêtes optimisées
- ✅ Index sur `(card_id, is_published)` pour projets
- ✅ Index sur `(card_id, status)` pour devis

---

## Changements dans le Code Frontend

### Modification Minimales Requises

Le code frontend est déjà compatible car :
- ✅ Les types TypeScript ont déjà `card_id?: string`
- ✅ Le service `portfolioService.ts` supporte déjà `card_id`

### Points à Vérifier

#### 1. Création de Portfolio Settings
Lors de la création d'un nouveau portfolio, **toujours passer le `card_id`** :

```typescript
// ❌ AVANT (incomplet)
const settings = await PortfolioService.createSettings(userId, {
  is_enabled: true,
  title: 'Mon Portfolio'
});

// ✅ APRÈS (complet)
const settings = await PortfolioService.createSettings(userId, {
  card_id: cardId,  // OBLIGATOIRE
  is_enabled: true,
  title: 'Mon Portfolio'
});
```

#### 2. Récupération des Settings
Utiliser `getCardSettings(cardId)` au lieu de `getUserSettings(userId)` :

```typescript
// ❌ AVANT
const settings = await PortfolioService.getUserSettings(userId);

// ✅ APRÈS
const settings = await PortfolioService.getCardSettings(cardId);
```

#### 3. Création de Projets
Toujours associer le projet à la carte :

```typescript
// ✅ CORRECT
const project = await PortfolioService.createProject(userId, {
  card_id: cardId,  // OBLIGATOIRE
  title: 'Mon Projet',
  // ... autres champs
});
```

#### 4. Statistiques
Utiliser la nouvelle fonction par carte :

```typescript
// ❌ AVANT
const stats = await PortfolioService.getStats(userId);

// ✅ APRÈS
const { data } = await supabase.rpc('get_portfolio_stats_by_card', {
  card_uuid: cardId
});
```

---

## Bénéfices de Cette Architecture

### ✅ Avantages

1. **Portfolios Indépendants** : Chaque carte = un portfolio unique
2. **Flexibilité** : Un freelance peut avoir :
   - Une carte "Designer Graphique" avec portfolio design
   - Une carte "Développeur" avec portfolio dev
   - Une carte "Consultant" avec portfolio conseil
3. **Analytics Séparées** : Statistiques distinctes par carte
4. **Branding Distinct** : Couleurs, styles différents par portfolio
5. **Pas de Confusion** : Les projets d'une carte ne se mélangent pas avec une autre

### 🎯 Cas d'Usage

**Exemple : Marie, Designer & Développeuse**

Marie a deux cartes professionnelles :

**Carte 1 : "Marie Design"**
- Portfolio avec projets graphiques
- Couleur de marque : Rose
- Services : Logo, Branding, UI/UX

**Carte 2 : "Marie Dev"**
- Portfolio avec projets web
- Couleur de marque : Bleu
- Services : Sites web, Apps, E-commerce

Chaque carte a son URL unique :
- `/card/uuid-1/portfolio` → Portfolio Design
- `/card/uuid-2/portfolio` → Portfolio Dev

---

## Migration des Données Existantes

### Si vous avez déjà des portfolios

Les portfolios existants doivent être associés à une carte :

```sql
-- Mettre à jour les portfolios existants sans card_id
UPDATE portfolio_settings
SET card_id = (
  SELECT id FROM business_cards
  WHERE user_id = portfolio_settings.user_id
  LIMIT 1
)
WHERE card_id IS NULL;
```

**⚠️ Attention** : Cette requête associe le portfolio à la première carte de l'utilisateur.
Si vous avez plusieurs cartes, vous devrez peut-être faire une assignation manuelle.

---

## Vérification Post-Migration

### Tests à Effectuer

1. ✅ Créer un nouveau portfolio pour une carte
2. ✅ Créer un second portfolio pour une autre carte du même utilisateur
3. ✅ Vérifier que les projets sont bien séparés par carte
4. ✅ Vérifier que les statistiques sont indépendantes
5. ✅ Tester l'accès public : `/card/:id/portfolio`

### Requêtes SQL de Vérification

```sql
-- Voir tous les portfolios avec leurs cartes
SELECT
  ps.id,
  ps.user_id,
  ps.card_id,
  bc.name as card_name,
  ps.title as portfolio_title,
  ps.is_enabled
FROM portfolio_settings ps
LEFT JOIN business_cards bc ON bc.id = ps.card_id;

-- Compter les portfolios par utilisateur
SELECT
  user_id,
  COUNT(*) as nb_portfolios
FROM portfolio_settings
GROUP BY user_id
HAVING COUNT(*) > 1;  -- Utilisateurs avec plusieurs portfolios

-- Vérifier les projets par carte
SELECT
  card_id,
  COUNT(*) as nb_projects
FROM portfolio_projects
WHERE card_id IS NOT NULL
GROUP BY card_id;
```

---

## Support et Questions

Si vous rencontrez des problèmes :

1. Vérifier que la migration SQL est bien appliquée
2. Vérifier que `card_id` est passé dans toutes les créations
3. Consulter les logs Supabase pour les erreurs RLS
4. Vérifier les policies avec : `SHOW POLICIES ON portfolio_settings;`

---

## Checklist de Déploiement

- [ ] Appliquer la migration SQL sur Supabase
- [ ] Vérifier que `card_id` est NOT NULL dans `portfolio_settings`
- [ ] Tester la création de portfolio pour une carte
- [ ] Tester la création de portfolio pour une 2e carte
- [ ] Vérifier l'affichage public des portfolios
- [ ] Vérifier les statistiques par carte
- [ ] Migrer les données existantes si nécessaire
- [ ] Tester l'ensemble du workflow (projets, devis, analytics)

---

**Date de Création** : 16 Janvier 2025
**Dernière Mise à Jour** : 16 Janvier 2025
**Version** : 1.0
