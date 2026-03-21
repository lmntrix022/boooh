# Portfolio/Services - Prochaines Étapes d'Implémentation UI

## 🎯 Objectif

Créer l'interface utilisateur complète pour le module Portfolio/Services en s'inspirant du design de la Marketplace existante.

---

## 📋 Checklist d'implémentation

### Phase 1 : Bouton d'accès sur la carte (1-2h)

#### Fichiers à modifier :
- [ ] `src/components/BusinessCard.tsx` ou
- [ ] `src/components/BusinessCardModern.tsx`

#### Code à ajouter :

```typescript
// 1. Importer le hook
import { useQuery } from '@tanstack/react-query';
import { PortfolioService } from '@/services/portfolioService';
import { Briefcase } from 'lucide-react';

// 2. Dans le composant, récupérer les settings
const { data: portfolioSettings } = useQuery({
  queryKey: ['portfolio-settings', cardId],
  queryFn: () => PortfolioService.getCardSettings(cardId),
  enabled: !!cardId
});

// 3. Ajouter le bouton à côté de "Voir la Boutique"
{portfolioSettings?.is_enabled && (
  <Button
    onClick={() => navigate(`/card/${cardId}/portfolio`)}
    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
  >
    <Briefcase className="w-4 h-4 mr-2" />
    {portfolioSettings.title || 'Mon Univers'}
  </Button>
)}
```

---

### Phase 2 : Vue Portfolio publique (4-6h)

#### Nouveau fichier : `src/pages/PortfolioView.tsx`

**Structure** :
```
/card/:id/portfolio
│
├── Header (Cover + Titre + Subtitle)
├── Filtres (Catégories + Tags)
├── Grille de projets
│   └── ProjectCard x N
└── Footer
```

#### Composants à créer :

##### 1. `src/components/portfolio/PortfolioHeader.tsx`
```typescript
interface PortfolioHeaderProps {
  settings: PortfolioSettings;
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

// Design :
// - Cover image full-width
// - Titre + sous-titre en overlay
// - Pills de catégories pour filtrer
```

##### 2. `src/components/portfolio/ProjectCard.tsx`
```typescript
interface ProjectCardProps {
  project: PortfolioProject;
  onClick: () => void;
}

// Design :
// - Image featured
// - Catégorie (badge)
// - Titre
// - Description courte (2 lignes max)
// - Hover effect
```

##### 3. `src/components/portfolio/ProjectDetailModal.tsx`
```typescript
interface ProjectDetailModalProps {
  project: PortfolioProject;
  isOpen: boolean;
  onClose: () => void;
  onCTAClick: () => void;
}

// Design :
// - Full-screen modal (ou Dialog large)
// - Galerie d'images (carousel)
// - Vidéo embed (si présente)
// - Section "Le Défi"
// - Section "La Solution"
// - Section "Le Résultat"
// - Témoignage client (si présent)
// - Bouton CTA principal
```

##### 4. `src/components/portfolio/QuoteRequestDialog.tsx`
```typescript
interface QuoteRequestDialogProps {
  projectId?: string;
  cardId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Formulaire avec React Hook Form + Zod :
// - Nom *
// - Email *
// - Téléphone
// - Entreprise
// - Service demandé *
// - Description du projet
// - Budget range (select)
// - Urgence (select)
// - Date de début souhaitée
```

#### Template de base :

```tsx
// src/pages/PortfolioView.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PortfolioService } from '@/services/portfolioService';
import { motion } from 'framer-motion';

import PortfolioHeader from '@/components/portfolio/PortfolioHeader';
import ProjectCard from '@/components/portfolio/ProjectCard';
import ProjectDetailModal from '@/components/portfolio/ProjectDetailModal';
import QuoteRequestDialog from '@/components/portfolio/QuoteRequestDialog';

export default function PortfolioView() {
  const { id: cardId } = useParams();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Récupérer les settings
  const { data: settings } = useQuery({
    queryKey: ['portfolio-settings', cardId],
    queryFn: () => PortfolioService.getCardSettings(cardId)
  });

  // Récupérer les projets
  const { data: projects = [] } = useQuery({
    queryKey: ['portfolio-projects', cardId],
    queryFn: () => PortfolioService.getCardProjects(cardId),
    enabled: !!cardId
  });

  // Filtrer par catégorie
  const filteredProjects = selectedCategory
    ? projects.filter(p => p.category === selectedCategory)
    : projects;

  // Extraire les catégories uniques
  const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <PortfolioHeader
        settings={settings}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Grille de projets */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard
                project={project}
                onClick={() => {
                  setSelectedProject(project);
                  PortfolioService.incrementProjectViews(project.id);
                  PortfolioService.trackEvent(project.user_id, 'view', {
                    projectId: project.id,
                    cardId
                  });
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal détail projet */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onCTAClick={() => {
          setShowQuoteDialog(true);
          PortfolioService.trackEvent(selectedProject.user_id, 'cta_click', {
            projectId: selectedProject.id,
            cardId
          });
        }}
      />

      {/* Dialog demande de devis */}
      <QuoteRequestDialog
        projectId={selectedProject?.id}
        cardId={cardId}
        userId={selectedProject?.user_id}
        isOpen={showQuoteDialog}
        onClose={() => setShowQuoteDialog(false)}
      />
    </div>
  );
}
```

---

### Phase 3 : Dashboard de gestion (6-8h)

#### Route à ajouter dans `src/App.tsx` :
```tsx
<Route path="/dashboard/portfolio" element={<PortfolioManagement />} />
<Route path="/dashboard/portfolio/projects" element={<ProjectsList />} />
<Route path="/dashboard/portfolio/projects/:id/edit" element={<ProjectEdit />} />
<Route path="/dashboard/portfolio/quotes" element={<QuotesList />} />
<Route path="/dashboard/portfolio/settings" element={<PortfolioSettings />} />
<Route path="/dashboard/portfolio/analytics" element={<PortfolioAnalytics />} />
```

#### Composants à créer :

##### 1. `src/pages/portfolio/PortfolioManagement.tsx`
```typescript
// Dashboard principal avec :
// - Statistiques en cards (total projets, vues, devis, conversion)
// - Graphique d'évolution
// - Top 5 projets
// - Dernières demandes de devis
// - Actions rapides (Nouveau projet, Voir les devis)
```

##### 2. `src/pages/portfolio/ProjectsList.tsx`
```typescript
// Liste des projets avec :
// - Tableau (ou grille) avec preview
// - Filtres (publié/brouillon, catégorie)
// - Tri drag-and-drop (order_index)
// - Actions : Éditer, Dupliquer, Publier/Dépublier, Supprimer
// - Bouton "Nouveau projet"
```

##### 3. `src/pages/portfolio/ProjectEdit.tsx`
```typescript
// Formulaire d'édition complet :
// - Tabs : Informations, Médias, Témoignage, Paramètres
// - Upload images (featured + gallery)
// - Embed vidéo
// - Upload PDF
// - WYSIWYG pour défi/solution/résultat
// - Configuration CTA
// - Preview en temps réel
```

##### 4. `src/pages/portfolio/QuotesList.tsx`
```typescript
// Gestion des devis :
// - Vue Kanban (comme Orders) OU
// - Vue Liste avec tableau
// - Filtres : statut, priorité, date
// - Détail d'un devis (modal ou page)
// - Actions : Répondre, Convertir en facture, Supprimer
```

##### 5. `src/pages/portfolio/PortfolioSettings.tsx`
```typescript
// Configuration :
// - Toggle activation
// - Branding (titre, sous-titre, couleur, cover)
// - Options d'affichage
// - Intégration RDV (Calendly URL, etc.)
// - Analytics (tracking on/off)
```

##### 6. `src/pages/portfolio/PortfolioAnalytics.tsx`
```typescript
// Analytics :
// - Cards avec métriques clés
// - Graphiques (Recharts ou Tremor)
// - Tableau des événements
// - Export CSV
```

---

### Phase 4 : Intégrations avancées (4-6h)

#### A. Conversion Devis → Facture

**Fichier** : `src/pages/portfolio/QuoteDetail.tsx`

```typescript
const handleConvertToInvoice = async (quote: ServiceQuote) => {
  // 1. Créer une facture pré-remplie
  const invoiceData: CreateInvoiceData = {
    client_name: quote.client_name,
    client_email: quote.client_email,
    client_phone: quote.client_phone,
    client_address: quote.client_company || '',
    items: [{
      description: quote.service_requested,
      quantity: 1,
      unit_price: quote.quote_amount || 0,
      vat_rate: 18
    }],
    notes: quote.project_description,
    payment_terms: 'Devis accepté le ' + new Date().toLocaleDateString()
  };

  const invoice = await InvoiceService.createInvoice(user.id, invoiceData);

  // 2. Mettre à jour le devis
  await PortfolioService.updateQuote(quote.id, {
    status: 'accepted',
    converted_to_invoice_id: invoice.id,
    conversion_date: new Date().toISOString()
  });

  // 3. Rediriger vers la facture
  navigate(`/facture?invoiceId=${invoice.id}`);

  toast({
    title: 'Devis converti',
    description: 'La facture a été créée avec succès.'
  });
};
```

#### B. Intégration Calendly

**Fichier** : `src/components/portfolio/BookingEmbed.tsx`

```typescript
interface BookingEmbedProps {
  bookingUrl: string;
  projectTitle?: string;
}

export function BookingEmbed({ bookingUrl, projectTitle }: BookingEmbedProps) {
  // Si Calendly
  if (bookingUrl.includes('calendly.com')) {
    return (
      <div className="calendly-inline-widget" data-url={bookingUrl} style={{ minWidth: 320, height: 630 }} />
    );
  }

  // Si Google Calendar ou autre
  return (
    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
      Réserver un créneau
    </a>
  );
}
```

Ajouter dans `index.html` :
```html
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

#### C. Upload de médias

**Utiliser** : `src/services/mediaService.ts` (déjà existant)

```typescript
// Dans ProjectEdit.tsx
const handleImageUpload = async (file: File) => {
  try {
    const url = await mediaService.uploadImage(file, 'portfolio-images');
    setFeaturedImage(url);
  } catch (error) {
    toast({
      title: 'Erreur',
      description: 'Impossible de télécharger l\'image',
      variant: 'destructive'
    });
  }
};
```

---

## 🎨 Design System

### Couleurs

Utiliser les couleurs du branding existant :

```typescript
// Primaire (Portfolio)
const portfolioColors = {
  primary: settings?.brand_color || '#8B5CF6', // Purple par défaut
  secondary: '#6366F1', // Indigo
  accent: '#EC4899', // Pink
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
};
```

### Composants UI à réutiliser

- ✅ `Button` - Boutons
- ✅ `Card` - Cards
- ✅ `Dialog` - Modals
- ✅ `Input` - Champs de formulaire
- ✅ `Badge` - Badges
- ✅ `Select` - Dropdowns
- ✅ `Tabs` - Tabs
- ✅ `Table` - Tableaux
- ✅ `Sheet` - Panneau latéral

### Animations

Utiliser Framer Motion :

```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  transition={{ delay: index * 0.1 }}
>
  <ProjectCard />
</motion.div>
```

---

## ✅ Checklist finale avant lancement

### Backend
- [x] Migration SQL appliquée
- [x] Tables créées et RLS configuré
- [x] Service TypeScript testé
- [x] Types exportés

### Frontend
- [ ] Bouton sur carte publique
- [ ] Vue Portfolio responsive
- [ ] Modal détail projet
- [ ] Formulaire devis
- [ ] Dashboard projets
- [ ] Dashboard devis
- [ ] Dashboard analytics
- [ ] Page settings

### Tests
- [ ] Créer un projet de test
- [ ] Publier le projet
- [ ] Afficher sur carte publique
- [ ] Soumettre une demande de devis
- [ ] Répondre au devis
- [ ] Vérifier les analytics

### Performance
- [ ] Images optimisées (WebP)
- [ ] Lazy loading des composants
- [ ] React Query pour le caching
- [ ] Index sur les colonnes de tri

### Sécurité
- [ ] RLS testée
- [ ] Validation Zod sur tous les formulaires
- [ ] Sanitization des inputs (XSS)
- [ ] Rate limiting sur createPublicQuote

---

## 🚀 Ordre d'implémentation recommandé

**Jour 1** :
1. Bouton sur carte publique
2. Vue Portfolio de base (header + grille)
3. ProjectCard composant

**Jour 2** :
4. Modal détail projet
5. Formulaire demande de devis
6. Testing de la vue publique

**Jour 3** :
7. Dashboard - Liste des projets
8. Formulaire édition projet (basique)

**Jour 4** :
9. Dashboard - Gestion des devis (liste)
10. Dashboard - Settings

**Jour 5** :
11. Dashboard - Analytics
12. Conversion devis → facture
13. Polish et optimisations

**Jour 6** :
14. Tests complets
15. Documentation utilisateur
16. Déploiement

---

## 📞 Ressources et références

### Code existant à étudier
- `src/pages/Orders.tsx` - Pour la vue Kanban des devis
- `src/components/invoice/*` - Pour le design des formulaires
- `src/pages/Marketplace.tsx` - Pour l'architecture de grille

### Librairies à installer (si pas déjà présentes)
```bash
npm install react-hook-form zod @hookform/resolvers
npm install react-dropzone # Pour upload de fichiers
npm install react-markdown # Pour affichage Markdown (si besoin)
```

---

**Prochaine action** : Commencer par le bouton sur la carte publique (Phase 1) 🚀

