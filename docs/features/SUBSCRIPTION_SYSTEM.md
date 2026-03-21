# Système d'Abonnement Bööh Card Magic

Documentation complète du système d'abonnement avec les plans FREE, BUSINESS et MAGIC.

## Plans Disponibles

### 🟢 FREE - "Découverte & Viralité"
**Prix:** 0 FCFA/mois  
**Cible:** Étudiants, jeunes créateurs, indépendants débutants

**Fonctionnalités:**
- 1 carte de visite digitale
- Thème par défaut (non personnalisable)
- QR code standard
- Analytics basiques
- Branding Bööh visible
- Commission marketplace: 3%

### 🔵 BUSINESS - "Vendre & Gérer"
**Prix:** 12,500 FCFA/mois  
**Cible:** Freelances, artisans, commerçants, coachs

**Fonctionnalités:**
- 1 carte premium personnalisée
- Tous les 10+ thèmes pro
- Boutique: 20 produits max
- Portfolio: 10 projets
- Facturation PDF
- Gestion de stock simple
- Rendez-vous simple
- Analytics avancés
- Commission: 1%
- Support email

### 🟣 MAGIC - "Automatiser & Équiper"
**Prix:** 25,000 FCFA/mois  
**Cible:** PME, agences, équipes commerciales

**Fonctionnalités:**
- 5 cartes premium (multi-équipe)
- Produits illimités + DRM
- Portfolio illimité
- Facturation avancée automatique
- Stock avancé avec alertes
- RDV avancés + Google Calendar
- CRM avec IA + OCR
- Carte interactive avec clustering
- Multi-utilisateurs (5 membres)
- Commission: 1%
- Support prioritaire

## Add-ons

| Add-on | Prix/mois | Description | Plans compatibles |
|--------|-----------|-------------|-------------------|
| Pack Créateur | 7,500 FCFA | DRM + watermarking | BUSINESS |
| Pack Volume | 5,000 FCFA | Extension à 50 produits | BUSINESS |
| Pack Équipe | 5,000 FCFA | Carte supplémentaire | BUSINESS, MAGIC |
| Pack Brand | 8,000 FCFA | Domaine personnalisé | BUSINESS, MAGIC |
| Pack Analytics Pro | 6,000 FCFA | Dashboard + Heatmap | BUSINESS, MAGIC |

## Architecture Technique

### 1. Types et Constantes (`src/types/subscription.ts`)

```typescript
import { PlanType, PlanFeatures, PLAN_FEATURES } from '@/types/subscription';

// Accéder aux features d'un plan
const businessFeatures = PLAN_FEATURES[PlanType.BUSINESS];
console.log(businessFeatures.maxCards); // 1
console.log(businessFeatures.hasEcommerce); // true
```

### 2. Hook `useSubscription`

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    subscription,      // Abonnement actuel
    planType,         // FREE | BUSINESS | MAGIC
    features,         // Features du plan
    addons,           // Add-ons actifs
    
    // Méthodes de vérification
    hasFeature,
    hasAddon,
    canCreateCard,
    canCreateProduct,
    canCreateProject,
    getTotalPrice,
    
    // Flags rapides
    isFree,
    isBusiness,
    isMagic,
    isActive,
  } = useSubscription();

  // Vérifier une feature
  if (hasFeature('hasEcommerce')) {
    // Afficher la boutique
  }

  // Vérifier les limites
  const cardLimit = await canCreateCard();
  if (!cardLimit.allowed) {
    console.log(`Limite atteinte: ${cardLimit.current}/${cardLimit.max}`);
  }
}
```

### 3. Composant `PlanGuard`

Protection déclarative des fonctionnalités :

```typescript
import { PlanGuard } from '@/components/subscription/PlanGuard';
import { PlanType } from '@/types/subscription';

// Par feature
<PlanGuard feature="hasEcommerce">
  <BoutiqueComponent />
</PlanGuard>

// Par plan requis
<PlanGuard requiredPlan={PlanType.BUSINESS}>
  <FeatureBusinessOnly />
</PlanGuard>

// Avec message personnalisé
<PlanGuard 
  feature="hasCRM" 
  customMessage="Le CRM est disponible dans le plan MAGIC"
>
  <CRMComponent />
</PlanGuard>

// Sans prompt d'upgrade (juste masquer)
<PlanGuard feature="hasPortfolio" showUpgradePrompt={false}>
  <PortfolioLink />
</PlanGuard>
```

### 4. Hook `usePlanGuard`

Pour les vérifications programmatiques :

```typescript
import { usePlanGuard } from '@/components/subscription/PlanGuard';

function MyComponent() {
  const { checkFeatureAccess, checkPlanAccess, currentPlan } = usePlanGuard();

  const handleCreateProduct = () => {
    if (!checkFeatureAccess('hasEcommerce')) {
      toast.error('Passez au plan BUSINESS pour activer la boutique');
      return;
    }
    
    // Créer le produit...
  };
}
```

## Migration Base de Données

Le fichier `supabase/migrations/20251017_create_subscriptions_table.sql` crée :

1. **Table `user_subscriptions`**
   - Stocke l'abonnement de chaque utilisateur
   - RLS activé (les users voient seulement leur abonnement)
   - Trigger pour créer automatiquement un plan FREE

2. **Fonction `has_feature_access()`**
   - Vérifie l'accès à une feature depuis Postgres
   - Utilisable dans les RLS policies

3. **Trigger automatique**
   - Crée un abonnement FREE lors de l'inscription

### Appliquer la migration

```bash
# Via Supabase CLI
supabase db push

# Ou via le dashboard Supabase
# SQL Editor > Coller le contenu du fichier > Run
```

## Exemples d'Utilisation

### Limiter la création de cartes

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function CreateCardButton() {
  const { canCreateCard } = useSubscription();
  
  const handleCreate = async () => {
    const limit = await canCreateCard();
    
    if (!limit.allowed) {
      toast.error(
        `Limite atteinte (${limit.current}/${limit.max}). Passez au plan BUSINESS.`
      );
      return;
    }
    
    // Créer la carte...
  };
  
  return <Button onClick={handleCreate}>Créer une carte</Button>;
}
```

### Protéger l'accès au CRM

```typescript
import { PlanGuard } from '@/components/subscription/PlanGuard';

function ContactsPage() {
  return (
    <div>
      <h1>Mes Contacts</h1>
      
      {/* CRM seulement pour MAGIC */}
      <PlanGuard feature="hasCRM">
        <CRMAdvancedFeatures />
      </PlanGuard>
    </div>
  );
}
```

### Afficher le plan actuel

```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS_INFO } from '@/types/subscription';

function SubscriptionBadge() {
  const { planType, getTotalPrice } = useSubscription();
  const planInfo = PLANS_INFO.find(p => p.type === planType);
  
  return (
    <div className="badge">
      <Crown className="mr-2" />
      {planInfo?.name} - {getTotalPrice()} FCFA/mois
    </div>
  );
}
```

### Navigation conditionnelle dans la sidebar

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function DashboardSidebar() {
  const { hasFeature } = useSubscription();
  
  return (
    <nav>
      <NavLink to="/dashboard">Tableau de bord</NavLink>
      
      {hasFeature('hasEcommerce') && (
        <NavLink to="/products">Produits</NavLink>
      )}
      
      {hasFeature('hasPortfolio') && (
        <NavLink to="/portfolio">Portfolio</NavLink>
      )}
      
      {hasFeature('hasCRM') && (
        <NavLink to="/contacts">CRM</NavLink>
      )}
    </nav>
  );
}
```

## Page de Tarification

Route: `/pricing`

Affiche tous les plans avec :
- Comparaison des features
- Add-ons disponibles
- Badge "Plan actuel"
- CTA d'upgrade

## Workflow Utilisateur

1. **Inscription** → Plan FREE automatique
2. **Utilisation** → Découverte des limites via upgrade prompts
3. **Upgrade** → Page /pricing → Sélection plan
4. **Paiement** → (À implémenter: Mobile Money, Wave, etc.)
5. **Activation** → Accès immédiat aux nouvelles features

## Prochaines Étapes

### À implémenter :

1. **Page de gestion d'abonnement** (`/settings/subscription`)
   - Voir le plan actuel
   - Historique de paiement
   - Gérer les add-ons
   - Annuler/réactiver

2. **Système de paiement**
   - Intégration Mobile Money (MTN, Orange, Moov)
   - Wave API
   - Webhooks de confirmation

3. **Edge Functions Supabase**
   - `upgrade-plan`: Changer de plan
   - `add-addon`: Ajouter un add-on
   - `cancel-subscription`: Annuler
   - `verify-payment`: Vérifier paiement

4. **Emails transactionnels**
   - Confirmation d'upgrade
   - Rappels de paiement
   - Factures mensuelles

5. **Analytics abonnements**
   - Taux de conversion FREE → BUSINESS
   - Churn rate
   - MRR (Monthly Recurring Revenue)

## Tests Recommandés

```typescript
// Test: Vérifier les limites
describe('Subscription Limits', () => {
  it('FREE plan allows 1 card only', async () => {
    const { canCreateCard } = useSubscription();
    const limit = await canCreateCard();
    expect(limit.max).toBe(1);
  });
  
  it('BUSINESS plan allows 20 products', async () => {
    const { canCreateProduct } = useSubscription();
    const limit = await canCreateProduct(cardId);
    expect(limit.max).toBe(20);
  });
});
```

## Support

Pour toute question sur le système d'abonnement :
- Documentation: Ce fichier
- Types: `src/types/subscription.ts`
- Migration SQL: `supabase/migrations/20251017_create_subscriptions_table.sql`
