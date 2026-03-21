# 🎨 Guide d'Intégration du Nouveau Pricing

## ✅ Ce qui a été créé

### 1. Composants Créés

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **PricingNewPlans** | `src/components/pricing/PricingNewPlans.tsx` | Grille des 4 nouveaux plans avec animations |
| **ROICalculatorInteractive** | `src/components/pricing/ROICalculatorInteractive.tsx` | Calculateur ROI interactif avec sliders |
| **OperePackagesSection** | `src/components/pricing/OperePackagesSection.tsx` | Section packages Setup pour Opéré |
| **PricingSection** | `src/components/landing/PricingSection.tsx` | Version compacte pour landing page |

### 2. Pages Créées

| Page | Route | Description |
|------|-------|-------------|
| **PricingNew** | `/pricing-new` | Page pricing complète avec les 4 offres + calculateur + FAQ |

---

## 🚀 Comment Intégrer

### Option 1: Remplacer la page pricing actuelle

Dans `src/App.tsx`, remplacez :

```typescript
<Route path="/pricing" element={<Pricing />} />
```

Par :

```typescript
<Route path="/pricing" element={<PricingNew />} />
```

### Option 2: Garder les deux versions (recommandé pour migration douce)

Gardez la route actuelle et ajoutez la nouvelle :

```typescript
<Route path="/pricing" element={<Pricing />} />        {/* Ancienne version */}
<Route path="/pricing-new" element={<PricingNew />} /> {/* Nouvelle version */}
```

Puis ajoutez un lien de migration dans l'ancienne page pricing.

---

## 📄 Intégrer dans la Landing Page

### Dans `src/pages/AwwardsLevelLanding.tsx`

#### Étape 1: Importer le composant

En haut du fichier, ajoutez :

```typescript
import PricingSection from '@/components/landing/PricingSection';
```

#### Étape 2: Remplacer la section Pricing existante

Remplacez :

```typescript
<Suspense fallback={<SectionLoader />}>
  <LazyPricing />
</Suspense>
```

Par :

```typescript
<PricingSection />
```

#### Ou créer une version lazy-loaded

```typescript
const LazyPricingNew = React.lazy(() => import('@/components/landing/PricingSection'));

// Dans le return:
<Suspense fallback={<SectionLoader />}>
  <LazyPricingNew />
</Suspense>
```

---

## 🎯 Utilisation des Composants

### 1. Grille des Plans (PricingNewPlans)

```tsx
import PricingNewPlans from '@/components/pricing/PricingNewPlans';

// Usage basique
<PricingNewPlans />

// Avec props
<PricingNewPlans 
  currentPlan="connexions"
  onSelectPlan={(planId) => console.log('Selected:', planId)}
  showComparison={true}
/>
```

### 2. Calculateur ROI (ROICalculatorInteractive)

```tsx
import ROICalculatorInteractive from '@/components/pricing/ROICalculatorInteractive';

<ROICalculatorInteractive />
```

### 3. Packages Opéré (OperePackagesSection)

```tsx
import OperePackagesSection from '@/components/pricing/OperePackagesSection';

<OperePackagesSection 
  onSelectPackage={(packageId) => {
    console.log('Selected package:', packageId);
    // Rediriger vers formulaire de contact ou paiement
  }}
/>
```

### 4. Section Landing (PricingSection)

```tsx
import PricingSection from '@/components/landing/PricingSection';

<PricingSection />
```

---

## 🎨 Personnalisation des Couleurs

Les plans utilisent des gradients Tailwind CSS. Pour modifier :

### Dans `PricingNewPlans.tsx`

```typescript
{
  id: 'essentiel',
  color: 'from-emerald-500 to-teal-600', // ← Modifier ici
  ctaColor: 'bg-gradient-to-r from-emerald-500 to-teal-600', // ← Et ici
}
```

### Palettes disponibles

- **Essentiel**: `from-emerald-500 to-teal-600` (vert)
- **Connexions**: `from-blue-500 to-indigo-600` (bleu)
- **Commerce**: `from-orange-500 to-pink-600` (orange-rose)
- **Opéré**: `from-purple-500 to-pink-600` (violet-rose)

---

## 📊 Données des Plans

### Structure des données

Les plans sont définis dans chaque composant. Pour centraliser, créez un fichier :

`src/data/newPricingData.ts`:

```typescript
export const NEW_PLANS = [
  {
    id: 'essentiel',
    name: 'BÖÖH Essentiel',
    price: 0,
    priceLabel: 'Gratuit',
    commission: 0,
    // ... autres propriétés
  },
  // ... autres plans
];
```

Puis importez dans vos composants :

```typescript
import { NEW_PLANS } from '@/data/newPricingData';
```

---

## 🔗 Navigation

### Mettre à jour les liens de navigation

Dans `src/components/layout/PublicNavbar.tsx`, vérifiez que le lien Pricing pointe vers `/pricing-new` :

```tsx
<Link to="/pricing-new">Tarifs</Link>
```

### Ajouter des liens CTA

Dans vos sections, utilisez :

```tsx
import { Link } from 'react-router-dom';

<Button asChild>
  <Link to="/pricing-new">Voir les offres</Link>
</Button>
```

---

## 💡 Conseils de Performance

### Lazy Loading

Pour de meilleures performances, utilisez le lazy loading :

```typescript
const PricingNewPlans = React.lazy(() => 
  import('@/components/pricing/PricingNewPlans')
);

// Dans votre composant
<Suspense fallback={<LoadingSpinner />}>
  <PricingNewPlans />
</Suspense>
```

### Préchargement

Préchargez la page pricing au survol du lien :

```tsx
<Link 
  to="/pricing-new"
  onMouseEnter={() => {
    import('./pages/PricingNew');
  }}
>
  Tarifs
</Link>
```

---

## 🧪 Tests

### Vérifier les composants

1. **Page pricing complète** : http://localhost:8081/pricing-new
2. **Section landing** : Intégrer dans `/` et vérifier
3. **Responsive** : Tester sur mobile, tablette, desktop
4. **Animations** : Vérifier les transitions et hover states

### Checklist

- [ ] ✅ Les 4 plans s'affichent correctement
- [ ] ✅ Le calculateur ROI fonctionne (slider + calculs)
- [ ] ✅ Les packages Opéré s'affichent
- [ ] ✅ Les liens CTA fonctionnent
- [ ] ✅ La page est responsive
- [ ] ✅ Les animations sont fluides
- [ ] ✅ Pas d'erreurs console

---

## 🎯 Prochaines Étapes

### 1. Migration en douceur

1. Lancer la nouvelle page sur `/pricing-new`
2. Ajouter un bandeau sur `/pricing` : "Nouvelle version disponible"
3. Recueillir les retours pendant 1 semaine
4. Basculer `/pricing` vers la nouvelle version

### 2. Analytics

Ajoutez le tracking :

```tsx
import { trackEvent } from '@/utils/analytics';

// Au clic sur un plan
trackEvent('pricing_plan_selected', { plan: 'connexions' });

// Sur le calculateur
trackEvent('roi_calculator_used', { 
  monthlyRevenue: monthlyRevenue,
  recommendedPlan: bestOption 
});
```

### 3. A/B Testing

Testez les deux versions avec un feature flag :

```tsx
const useNewPricing = useFeatureFlag('new_pricing_2026');

return useNewPricing ? <PricingNew /> : <Pricing />;
```

---

## 🐛 Dépannage

### Le composant ne s'affiche pas

Vérifiez :
1. ✅ L'import est correct
2. ✅ La route existe dans `App.tsx`
3. ✅ Pas d'erreurs dans la console
4. ✅ Les dépendances sont installées

### Les animations ne fonctionnent pas

Vérifiez que `framer-motion` est installé :

```bash
npm install framer-motion
# ou
yarn add framer-motion
```

### Les styles ne s'appliquent pas

Vérifiez que Tailwind CSS compile les classes :

```bash
npm run dev
```

---

## 📚 Ressources

- **Composants UI** : Basés sur shadcn/ui
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Design** : Apple-level minimaliste

---

## 🎊 C'est Terminé !

Votre nouveau système de pricing est prêt. Les 4 offres sont cohérentes, le calculateur ROI est interactif, et le design est moderne et responsive.

**Questions ?** Consultez les composants créés ou demandez de l'aide !

---

**Créé le** : 23 janvier 2026
**Version** : 1.0.0
**Compatibilité** : React 18+, TypeScript 5+
