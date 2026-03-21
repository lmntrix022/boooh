# Guide de Démarrage Rapide - Système d'Abonnement

## ✅ Ce qui a été fait

1. **Migration Base de Données** - Appliquée ✓
   - Table `user_subscriptions` créée
   - Trigger automatique : Plan FREE lors de l'inscription
   - RLS activé pour la sécurité

2. **Types et Constantes** - [src/types/subscription.ts](src/types/subscription.ts)
   - Plans : FREE, BUSINESS, MAGIC
   - Add-ons : Pack Créateur, Volume, Équipe, Brand, Analytics Pro
   - Prix et features détaillés

3. **Hook React** - [src/hooks/useSubscription.ts](src/hooks/useSubscription.ts)
4. **Composants** - PlanGuard, UpgradePrompt
5. **Page Pricing** - [/pricing](http://localhost:8080/pricing)
6. **Routes protégées** - Toutes les pages avec sidebar redirigent vers /auth

## 🚀 Comment utiliser

### 1. Protéger une fonctionnalité

```tsx
import { PlanGuard } from '@/components/subscription/PlanGuard';

function MyComponent() {
  return (
    <PlanGuard feature="hasEcommerce">
      <BoutiqueComponent />
    </PlanGuard>
  );
}
```

### 2. Vérifier les limites

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function CreateCardButton() {
  const { canCreateCard } = useSubscription();
  
  const handleClick = async () => {
    const limit = await canCreateCard();
    
    if (!limit.allowed) {
      toast.error(`Limite atteinte (${limit.current}/${limit.max})`);
      return;
    }
    
    // Créer la carte...
  };
  
  return <Button onClick={handleClick}>Créer une carte</Button>;
}
```

### 3. Afficher des éléments conditionnels

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function Sidebar() {
  const { hasFeature, isFree } = useSubscription();
  
  return (
    <nav>
      <Link to="/dashboard">Tableau de bord</Link>
      
      {hasFeature('hasEcommerce') && (
        <Link to="/products">Produits</Link>
      )}
      
      {hasFeature('hasCRM') && (
        <Link to="/crm">CRM</Link>
      )}
      
      {isFree && (
        <Link to="/pricing">
          <Badge>Passer à BUSINESS</Badge>
        </Link>
      )}
    </nav>
  );
}
```

## 📋 Exemples par Feature

### E-commerce
```tsx
<PlanGuard feature="hasEcommerce">
  <ProductManager />
</PlanGuard>
```

### Portfolio
```tsx
<PlanGuard feature="hasPortfolio">
  <PortfolioProjects />
</PlanGuard>
```

### CRM (MAGIC only)
```tsx
<PlanGuard feature="hasCRM">
  <ContactsWithAI />
</PlanGuard>
```

### Vérifier limite de produits
```tsx
const { canCreateProduct } = useSubscription();

const checkLimit = async () => {
  const limit = await canCreateProduct(cardId);
  
  if (!limit.allowed) {
    if (limit.max === 20) {
      toast.info('Ajoutez le Pack Volume pour 50 produits');
    } else {
      toast.info('Passez à MAGIC pour produits illimités');
    }
    return false;
  }
  
  return true;
};
```

## 🎯 Features Disponibles par Plan

| Feature | FREE | BUSINESS | MAGIC |
|---------|------|----------|-------|
| Cartes | 1 | 1 | 5 |
| E-commerce | ❌ | ✅ (20) | ✅ (∞) |
| Portfolio | ❌ | ✅ (10) | ✅ (∞) |
| Facturation | ❌ | ✅ | ✅ Avancée |
| Stock | ❌ | ✅ | ✅ Avancé |
| Rendez-vous | ❌ | ✅ | ✅ + Google Cal |
| CRM | ❌ | ❌ | ✅ + IA |
| Thèmes custom | ❌ | ✅ | ✅ |
| Commission | 3% | 1% | 1% |

## 🛠️ Prochaines Étapes

### 1. Tester le système
```bash
# Lancer l'app
npm run dev

# Aller sur /pricing
# Créer un compte → Plan FREE automatique
# Tester les restrictions
```

### 2. Ajouter des restrictions
Recherchez dans votre code où il faut ajouter `<PlanGuard>` :
- Pages de produits
- Pages de portfolio
- Formulaires de facturation
- etc.

### 3. Implémenter les paiements
Créer des Edge Functions :
- `upgrade-plan` - Changer de plan
- `add-addon` - Ajouter un add-on
- `verify-payment` - Vérifier paiement Mobile Money

### 4. Page de gestion
Créer `/settings/subscription` pour :
- Voir plan actuel
- Gérer add-ons
- Historique de paiement
- Annuler/réactiver

## 📚 Ressources

- **Documentation complète** : [SUBSCRIPTION_SYSTEM.md](SUBSCRIPTION_SYSTEM.md)
- **Types** : [src/types/subscription.ts](src/types/subscription.ts)
- **Hook** : [src/hooks/useSubscription.ts](src/hooks/useSubscription.ts)
- **Migration SQL** : [supabase/migrations/20251017_create_subscriptions_table.sql](supabase/migrations/20251017_create_subscriptions_table.sql)

## 🐛 Debug

### Vérifier l'abonnement d'un user
```sql
SELECT * FROM user_subscriptions WHERE user_id = '<user-id>';
```

### Créer un abonnement manuellement
```sql
INSERT INTO user_subscriptions (user_id, plan_type, status)
VALUES ('<user-id>', 'business', 'active');
```

### Tester les features
```tsx
import { useSubscription } from '@/hooks/useSubscription';

function DebugPanel() {
  const { subscription, features, planType } = useSubscription();
  
  return (
    <pre>
      Plan: {planType}
      {JSON.stringify(features, null, 2)}
    </pre>
  );
}
```

## ✨ Tips

1. **Toujours vérifier les limites AVANT l'action**
   ```tsx
   const limit = await canCreateCard();
   if (!limit.allowed) return;
   ```

2. **Afficher des messages clairs**
   ```tsx
   <PlanGuard 
     feature="hasCRM"
     customMessage="Le CRM avec IA est disponible avec MAGIC"
   >
   ```

3. **Utiliser isFree pour les badges**
   ```tsx
   {isFree && <Badge>Gratuit</Badge>}
   {isBusiness && <Badge>Business</Badge>}
   {isMagic && <Badge variant="premium">Magic</Badge>}
   ```

## 🎉 C'est prêt !

Le système est maintenant opérationnel. Vous pouvez :
- ✅ Protéger les features
- ✅ Vérifier les limites
- ✅ Afficher les upgrades prompts
- ✅ Gérer les plans utilisateurs

**Prochaine étape** : Intégrer Mobile Money pour les paiements ! 💰
