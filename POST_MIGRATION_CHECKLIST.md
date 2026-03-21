# ✅ POST-MIGRATION CHECKLIST

## 🎉 Migration Terminée !

Maintenant vérifions que tout fonctionne correctement.

---

## 📋 ÉTAPE 1 : Vérifier la Base de Données

### Dans le Dashboard Supabase → SQL Editor

Exécutez le fichier `VERIFICATION_MIGRATION.sql` pour vérifier :

```sql
-- Copier/Coller le contenu de VERIFICATION_MIGRATION.sql
```

### ✅ Résultats Attendus

| Test | Résultat Attendu |
|------|------------------|
| 1. Enum | 7 valeurs (free, business, magic, essentiel, connexions, commerce, opere) |
| 2. Commissions | 7 lignes (3 legacy + 4 nouveaux) |
| 3. Packages | 4 lignes (Standard, Business, Premium, Enterprise) |
| 4. Tables | 5 tables créées |
| 5. Fonctions | 2 fonctions (has_paid_opere_setup, get_plan_commission_config) |
| 6. RLS Policies | Au moins 5 policies actives |
| 7. Calculs | Commissions correctes pour chaque plan |

---

## 🚀 ÉTAPE 2 : Tester l'Application

### A. Démarrer l'application

```bash
cd "/Users/valerie/Downloads/booooh-main 2"
npm run dev
```

### B. Pages à Vérifier

| Page | URL | À Vérifier |
|------|-----|------------|
| **Pricing** | `/pricing` | Affiche les 4 nouveaux plans |
| **Migration Assistant** | `/migrate` | Recommandations personnalisées |
| **Opéré Packages** | `/opere-packages` | 4 packages avec prix |
| **Dashboard** | `/dashboard` | Pas d'erreurs console |

---

## 🔍 ÉTAPE 3 : Vérifications TypeScript

### Vérifier qu'il n'y a pas d'erreurs

```bash
# Vérifier TypeScript
npx tsc --noEmit

# Vérifier les lints
npm run lint
```

---

## 📊 ÉTAPE 4 : Vérifier les Types & Hooks

### Les nouveaux types doivent être disponibles

```typescript
// Dans n'importe quel composant React
import { useNewSubscription } from '@/hooks/useNewSubscription';
import { PlanType } from '@/types/subscription';

// Les nouveaux plans doivent être disponibles
const plans: PlanType[] = [
  'essentiel',    // ✅
  'connexions',   // ✅
  'commerce',     // ✅
  'opere'         // ✅
];
```

---

## 🎯 ÉTAPE 5 : Tester les Fonctionnalités Clés

### A. Calcul de Commission

```typescript
import { calculateDynamicCommission } from '@/services/dynamicCommissionService';

// Test Commerce (5%)
const result = calculateDynamicCommission(1000000, 'commerce');
// Attendu: { commission: 50000, monthlyFee: 0, total: 50000 }

// Test Opéré (10%)
const result2 = calculateDynamicCommission(1000000, 'opere');
// Attendu: { commission: 100000, monthlyFee: 0, total: 100000 }
```

### B. ROI Calculator

```typescript
import { calculateOpereROI } from '@/services/opereROICalculator';

// Test avec package Business
const roi = calculateOpereROI({
  packagePrice: 150000,
  monthlyRevenue: 5000000,
  currentPlan: 'free'
});

// Doit retourner:
// - setupFee: 150000
// - oldCommission: 150000 (3% sur 5M)
// - newCommission: 500000 (10% sur 5M)
// - netBenefit: négatif (commission plus élevée)
// - breakEvenMonths: nombre de mois pour rentabiliser
```

### C. Setup Packages

```typescript
import { useOpereSetup } from '@/hooks/useOpereSetup';

// Dans un composant
const { packages, loading } = useOpereSetup();

// Doit charger 4 packages:
// - Standard (50K)
// - Business (150K) [POPULAR]
// - Premium (300K)
// - Enterprise (500K)
```

---

## 🐛 ÉTAPE 6 : Dépannage

### Erreur : "Type subscription_plan does not exist"

```bash
# L'enum n'existe pas → Réexécutez step1 et step2
```

### Erreur : "Table commission_tiers does not exist"

```bash
# Les tables n'ont pas été créées → Réexécutez step3
```

### Erreur : "Cannot read properties of undefined"

```typescript
// Vérifiez que les types sont bien importés
import type { PlanType } from '@/types/subscription';

// Et non:
import { PlanType } from '@/types/subscription'; // ❌ (si c'est juste un type)
```

### L'application ne démarre pas

```bash
# Vérifier les dépendances
npm install

# Vérifier le fichier .env
cp .env.example .env
# Puis configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

---

## 📈 ÉTAPE 7 : Migration des Utilisateurs Existants (Optionnel)

Si vous avez des utilisateurs avec les anciens plans (free, business, magic), ils continuent de fonctionner car les configurations sont dans `commission_tiers` avec `is_legacy = true`.

### Script de Migration Utilisateurs (à exécuter si besoin)

```sql
-- Voir combien d'utilisateurs sont sur les anciens plans
SELECT 
    plan_type,
    COUNT(*) as user_count
FROM user_subscriptions
GROUP BY plan_type
ORDER BY user_count DESC;

-- Créer des incentives pour migrer
-- (À personnaliser selon vos besoins)
```

---

## 🎊 ÉTAPE 8 : Checklist Finale

- [ ] ✅ Base de données: 7 enum values, 5 tables, 2 functions
- [ ] ✅ Application démarre sans erreurs
- [ ] ✅ Page `/pricing` affiche les nouveaux plans
- [ ] ✅ Calculs de commission corrects
- [ ] ✅ Packages Opéré s'affichent correctement
- [ ] ✅ Pas d'erreurs TypeScript
- [ ] ✅ Pas d'erreurs dans la console navigateur
- [ ] ✅ Les hooks fonctionnent (`useNewSubscription`, `useOpereSetup`)

---

## 🚀 Prêt pour la Production !

Une fois toutes les cases cochées :

1. **Commit les changements**
   ```bash
   git add .
   git commit -m "feat: Nouveau modèle de souscription (4 offres)"
   ```

2. **Push vers production**
   ```bash
   git push origin main
   # Ou votre branche de production
   ```

3. **Communiquer aux utilisateurs**
   - Email de présentation des nouvelles offres
   - Message dans l'app
   - Documentation mise à jour

---

## 📞 Support

Si vous rencontrez un problème :

1. Vérifiez les logs Supabase (Dashboard → Logs)
2. Vérifiez la console navigateur (F12)
3. Exécutez `VERIFICATION_MIGRATION.sql` pour diagnostiquer

---

## 🎯 Prochaines Étapes Recommandées

1. **Analytics** : Tracker les conversions vers les nouveaux plans
2. **A/B Testing** : Tester les messages de migration
3. **Feedback** : Recueillir les retours utilisateurs
4. **Optimisation** : Ajuster les prix/packages selon les données

---

**Félicitations ! Le nouveau modèle de souscription est maintenant en production ! 🎉**
