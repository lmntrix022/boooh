# Guide : Gestion des Services du Portfolio

## 📋 Vue d'ensemble

Le système de services du portfolio permet aux utilisateurs de configurer et afficher leurs services directement dans les paramètres du portfolio. Les services sont stockés dans la base de données et peuvent être gérés via l'interface d'administration.

---

## 🗄️ Structure de la base de données

### Table : `portfolio_services`

```sql
CREATE TABLE portfolio_services (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id UUID,

  -- Informations du service
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'sparkles',

  -- Prix
  price_type VARCHAR(20) DEFAULT 'custom', -- 'fixed', 'from', 'custom', 'free'
  price DECIMAL(10, 2),
  price_label VARCHAR(100), -- ex: "Sur devis", "À partir de 500€"

  -- CTA
  cta_label VARCHAR(100) DEFAULT 'Demander un devis',
  cta_url TEXT,

  -- Affichage
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Migration SQL

Le fichier de migration est disponible dans :
```
supabase/migrations/20250115_create_portfolio_services.sql
```

Pour l'appliquer :
```bash
# Via Supabase CLI
supabase db push

# Ou via le dashboard Supabase
# SQL Editor > Coller le contenu du fichier > Run
```

---

## 🔧 API Service

### Fichier : `src/services/portfolioService.ts`

#### Types

```typescript
export type PriceType = 'fixed' | 'from' | 'custom' | 'free';

export interface PortfolioService {
  id: string;
  user_id: string;
  card_id?: string;
  title: string;
  description?: string;
  icon: string; // Nom de l'icône lucide-react
  price_type: PriceType;
  price?: number;
  price_label?: string;
  cta_label: string;
  cta_url?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Fonctions disponibles

```typescript
// Obtenir les services d'une carte (publics uniquement)
PortfolioService.getCardServices(cardId: string): Promise<PortfolioService[]>

// Obtenir tous les services d'un utilisateur
PortfolioService.getUserServices(userId: string): Promise<PortfolioService[]>

// Créer un nouveau service
PortfolioService.createService(service: Omit<PortfolioService, 'id' | 'created_at' | 'updated_at'>): Promise<PortfolioService>

// Mettre à jour un service
PortfolioService.updateService(serviceId: string, updates: Partial<PortfolioService>): Promise<PortfolioService>

// Supprimer un service
PortfolioService.deleteService(serviceId: string): Promise<void>

// Réorganiser les services
PortfolioService.reorderServices(serviceIds: string[]): Promise<void>
```

---

## 🎨 Composant Frontend

### Fichier : `src/components/portfolio/PortfolioServices.tsx`

Le composant charge automatiquement les services depuis la base de données et les affiche avec le design Apple-style.

#### Icônes disponibles

```typescript
const ICON_MAP = {
  sparkles: Sparkles,
  zap: Zap,
  code: Code,
  palette: Palette,
  rocket: Rocket,
  cpu: Cpu,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  target: Target,
  trending: TrendingUp,
  award: Award,
  star: Star,
  heart: Heart,
  smile: Smile,
  package: Package,
};
```

#### Format de prix

Le composant formate automatiquement le prix selon le `price_type` :

- **fixed** : `500€`
- **from** : `À partir de 500€`
- **custom** : `Sur devis`
- **free** : `Gratuit`

Si `price_label` est fourni, il remplace le formatage automatique.

---

## 📝 Exemple d'utilisation

### 1. Créer un service via code

```typescript
import { PortfolioService } from '@/services/portfolioService';

const newService = await PortfolioService.createService({
  user_id: currentUser.id,
  card_id: cardId,
  title: "Développement Web",
  description: "Création de sites et applications web modernes, rapides et performants.",
  icon: "code",
  price_type: "from",
  price: 500,
  cta_label: "Demander un devis",
  order_index: 0,
  is_published: true
});
```

### 2. Afficher les services dans le portfolio

Le composant `PortfolioServices` est déjà intégré dans `PortfolioView.tsx` :

```tsx
<PortfolioServices
  accentColor={accentColor}
  fontFamily={fontFamily}
  cardId={id!}
  onContact={() => {
    if (card.email) {
      window.location.href = `mailto:${card.email}`;
    }
  }}
/>
```

### 3. Si aucun service n'est configuré

Le composant retourne `null` et la section ne s'affiche pas. Cela évite d'afficher une section vide.

---

## 🛠️ Interface d'administration

L'interface complète de gestion des services est disponible dans le composant [PortfolioServicesSettings.tsx](src/pages/portfolio/PortfolioServicesSettings.tsx).

### Page : `/portfolio/services`

**Fonctionnalités implémentées :**
- ✅ Liste des services existants avec drag handles
- ✅ Formulaire de création/édition avec validation
- ✅ Sélecteur d'icônes (15 icônes Lucide disponibles)
- ✅ Gestion des prix (fixed/from/custom/free)
- ✅ Toggle publié/non publié
- ✅ Suppression avec confirmation
- ✅ Templates de services pré-configurés
- ✅ Design Apple-style cohérent avec le portfolio

### Composant : `PortfolioServicesSettings.tsx`

**Structure principale :**

```tsx
// Chargement des services de l'utilisateur
const { data: services = [] } = useQuery({
  queryKey: ['user-services', user?.id],
  queryFn: () => PortfolioServiceClass.getUserServices(user!.id)
});

// Mutations CRUD
const createMutation = useMutation({
  mutationFn: PortfolioServiceClass.createService,
  onSuccess: () => {
    queryClient.invalidateQueries(['user-services']);
    showSuccess('Service créé !');
  }
});

const updateMutation = useMutation({
  mutationFn: ({ id, updates }) =>
    PortfolioServiceClass.updateService(id, updates),
});

const deleteMutation = useMutation({
  mutationFn: PortfolioServiceClass.deleteService,
});
```

**Templates disponibles :**

```typescript
const SERVICE_TEMPLATES = [
  {
    title: "Développement Web",
    description: "Création de sites et applications web...",
    icon: "code",
    price_type: "from",
    price: 500,
  },
  {
    title: "Design UI/UX",
    description: "Conception d'interfaces intuitives...",
    icon: "palette",
    price_type: "from",
    price: 800,
  },
  {
    title: "Stratégie Digitale",
    description: "Accompagnement stratégique...",
    icon: "rocket",
    price_type: "custom",
  },
];
```

---

## 🎯 Prochaines étapes

1. ✅ ~~Créer l'interface d'administration~~ - **Terminé**
2. ⏳ **Ajouter un lien** dans PortfolioSettings pour accéder à `/portfolio/services`
3. ⏳ **Implémenter le drag & drop UI** - La fonction `reorderServices()` existe mais l'interface de réorganisation reste à finaliser
4. ⏳ **Tester le workflow complet** avec des données réelles
5. ⏳ **Appliquer la migration SQL** en production via Supabase
6. ⏳ **Ajouter plus d'icônes** au ICON_MAP si nécessaire

---

## 💡 Cas d'usage

### Freelance / Agence

```typescript
// Service 1
{
  title: "Design UI/UX",
  icon: "palette",
  price_type: "from",
  price: 800,
  description: "Conception d'interfaces intuitives..."
}

// Service 2
{
  title: "Développement Frontend",
  icon: "code",
  price_type: "custom",
  price_label: "Sur devis",
  description: "React, Vue.js, Next.js..."
}

// Service 3
{
  title: "Audit gratuit",
  icon: "target",
  price_type: "free",
  description: "Analyse gratuite de votre projet"
}
```

---

## ✅ Checklist de déploiement

- [x] Créer la migration SQL
- [x] Ajouter les types dans portfolioService.ts
- [x] Créer les fonctions CRUD
- [x] Mettre à jour PortfolioServices.tsx pour charger depuis la DB
- [x] Créer l'interface d'administration PortfolioServicesSettings.tsx
- [x] Ajouter la route `/portfolio/services` dans App.tsx
- [ ] Ajouter le lien vers `/portfolio/services` dans PortfolioSettings
- [ ] Appliquer la migration en production via Supabase CLI ou Dashboard
- [ ] Tester avec des données réelles (CRUD complet)
- [ ] Documenter pour les utilisateurs finaux

---

## 🔒 Sécurité

Les RLS (Row Level Security) policies sont configurées pour :
- ✅ Tout le monde peut voir les services **publiés**
- ✅ Les utilisateurs peuvent voir **tous** leurs services
- ✅ Les utilisateurs peuvent créer/modifier/supprimer **uniquement** leurs services
- ✅ Impossible de modifier les services des autres utilisateurs

---

## 📞 Support

Pour toute question ou assistance, consultez :
- 📚 Documentation Supabase : https://supabase.com/docs
- 🎨 Icônes Lucide : https://lucide.dev/icons/
- 💬 Issues GitHub du projet
