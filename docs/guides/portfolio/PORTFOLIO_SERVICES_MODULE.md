# Module Portfolio/Services (Mon Univers)

## 📋 Vue d'ensemble

Le module **Portfolio/Services** (Mon Univers) est une extension stratégique de la plateforme Bööh conçue spécifiquement pour les prestataires de services professionnels : consultants, graphistes, développeurs, artisans, formateurs, etc.

### Objectifs principaux

1. **Crédibilité** : Mise en valeur des réalisations passées
2. **Conversion** : Capture de leads qualifiés (devis + RDV)
3. **Gestion** : Suivi du pipeline commercial (CRM intégré)

---

## 🎯 Cas d'usage

### Pour qui ?

- **Consultants** : Portfolio de missions, témoignages clients
- **Graphistes** : Galerie de créations, études de cas
- **Développeurs** : Projets réalisés, stack technique
- **Artisans** : Photos de réalisations, devis personnalisés
- **Formateurs** : Programmes, témoignages, réservation de sessions

### Différence avec la Marketplace

| **Marketplace** | **Portfolio/Services** |
|---|---|
| Produits à prix fixe | Services sur-mesure |
| Achat immédiat | Devis personnalisé |
| Stock physique/digital | Prestations |
| Panier + Paiement | Formulaire + RDV |

---

## ✅ Implémentation actuelle

### 1. Base de données (Migration SQL) ✅

**Fichier** : `supabase/migrations/20251014_create_portfolio_services_tables.sql`

#### Tables créées :

##### `portfolio_projects` - Réalisations
- **Métadonnées** : titre, slug, catégorie, tags
- **Contenu riche** : description, défi, solution, résultat
- **Médias** : image, galerie, vidéo, PDF
- **Call-to-Action** : type (contact/devis/RDV), label, URL
- **Témoignage** : auteur, contenu, note, date
- **Suivi** : publié, vues, ordre

##### `service_quotes` - Demandes de devis
- **Client** : nom, email, téléphone, entreprise
- **Demande** : service, description, budget, urgence, date
- **Statut CRM** : new, in_progress, quoted, accepted, refused, closed
- **Proposition** : montant, devise, PDF, date d'envoi, expiration
- **Conversion** : lien vers facture, date de conversion
- **Notes** : notes internes pour le suivi

##### `portfolio_settings` - Configuration
- **Activation** : is_enabled
- **Branding** : titre, sous-titre, image de couverture, couleur
- **Affichage** : catégories, témoignages, pagination, vue
- **Intégrations** : système de RDV (Calendly, Google Calendar)
- **Analytics** : tracking des vues, demandes de devis

##### `portfolio_analytics` - Statistiques détaillées
- **Événements** : view, cta_click, quote_request, booking_click
- **Visiteur** : IP, pays, ville, referrer, user agent
- **Métadonnées** : données JSON personnalisées

#### Fonctions SQL :

- `generate_unique_slug()` : Génération de slugs uniques
- `get_portfolio_stats()` : Statistiques agrégées
- **Triggers** : Mise à jour automatique de `updated_at`

#### Row-Level Security (RLS) :

- **Propriétaires** : CRUD complet sur leurs données
- **Public** : Lecture des projets publiés uniquement
- **Visiteurs** : Peuvent créer des demandes de devis

---

### 2. Service TypeScript ✅

**Fichier** : `src/services/portfolioService.ts`

#### Fonctionnalités implémentées :

##### Projects
- ✅ `createProject()` - Créer un projet avec slug unique
- ✅ `getUserProjects()` - Liste des projets (avec filtre publié)
- ✅ `getCardProjects()` - Projets d'une carte (vue publique)
- ✅ `getProjectBySlug()` - Projet par slug
- ✅ `updateProject()` - Mettre à jour
- ✅ `deleteProject()` - Supprimer
- ✅ `incrementProjectViews()` - Compteur de vues

##### Quotes
- ✅ `createQuote()` - Créer un devis (propriétaire)
- ✅ `createPublicQuote()` - Créer un devis (visiteur)
- ✅ `getUserQuotes()` - Liste des devis (avec filtres)
- ✅ `updateQuote()` - Mettre à jour
- ✅ `deleteQuote()` - Supprimer

##### Settings
- ✅ `getSettings()` - Paramètres utilisateur
- ✅ `getCardSettings()` - Paramètres carte (public)
- ✅ `upsertSettings()` - Créer/MAJ paramètres

##### Analytics
- ✅ `trackEvent()` - Enregistrer un événement
- ✅ `getStats()` - Statistiques globales
- ✅ `getAnalytics()` - Événements avec filtres
- ✅ `getTopProjects()` - Projets les plus consultés

#### Types TypeScript :

```typescript
- PortfolioProject
- ServiceQuote
- PortfolioSettings
- PortfolioAnalytics
- PortfolioStats
- CTAType, QuoteStatus, QuotePriority, etc.
```

---

## 🚧 Prochaines étapes

### 3. Interface utilisateur (À faire)

#### A. Bouton sur la carte principale

**Fichier à modifier** : `src/components/BusinessCard.tsx` ou `src/components/BusinessCardModern.tsx`

**Emplacement** : À côté du bouton "Voir la Boutique"

**Conditions d'affichage** :
```typescript
if (portfolioSettings?.is_enabled && publishedProjects.length > 0) {
  // Afficher le bouton "Mon Univers"
}
```

**Design** :
- Icône : `Briefcase` ou `Award`
- Texte : "Mon Univers" (personnalisable via settings)
- Style : Cohérent avec le branding de la carte

#### B. Vue Portfolio plein écran

**Nouveau composant** : `src/components/portfolio/PortfolioView.tsx`

**Structure** :
1. **Header** :
   - Image de couverture
   - Titre + sous-titre
   - Navigation par catégories

2. **Grille de projets** :
   - Vue grid/list/masonry (selon settings)
   - Filtres par catégorie/tags
   - Tri (récent, populaire, alphabétique)

3. **Carte projet** :
   - Image featured
   - Titre + catégorie
   - Description courte
   - Bouton CTA

4. **Modal détail projet** :
   - Galerie d'images
   - Vidéo (si présente)
   - Texte structuré (Défi/Solution/Résultat)
   - Témoignage client
   - Bouton CTA principal

#### C. Formulaire de demande de devis

**Composant** : `src/components/portfolio/QuoteRequestForm.tsx`

**Champs** :
- Nom *
- Email *
- Téléphone
- Entreprise
- Service demandé *
- Description du projet
- Budget indicatif
- Urgence (urgent/normal/flexible)
- Date de début souhaitée

**Actions** :
- Validation Zod
- Envoi via `PortfolioService.createPublicQuote()`
- Toast de confirmation
- Email de notification au propriétaire

#### D. Intégration prise de RDV

**Options** :
1. **Calendly** : Iframe embed
2. **Google Calendar** : Lien direct
3. **Interne** : Utiliser le système existant `/appointments`

**Implémentation** :
```typescript
if (portfolioSettings.booking_system === 'calendly') {
  // Afficher iframe Calendly
} else if (portfolioSettings.booking_system === 'google_calendar') {
  // Lien vers Google Calendar
} else {
  // Utiliser /appointments
}
```

---

### 4. Dashboard de gestion (À faire)

#### A. Page liste des projets

**Route** : `/dashboard/portfolio/projects`

**Fonctionnalités** :
- Liste des projets avec preview
- Statut publié/brouillon
- Tri drag-and-drop (order_index)
- Actions : Éditer, Dupliquer, Supprimer
- Bouton "Nouveau projet"

#### B. Formulaire d'édition projet

**Route** : `/dashboard/portfolio/projects/:id/edit`

**Sections** :
1. **Informations générales** : Titre, catégorie, tags
2. **Contenu** : Description, Défi/Solution/Résultat
3. **Médias** : Upload images/vidéos/PDF
4. **CTA** : Type, label, URL
5. **Témoignage** : Auteur, contenu, note
6. **Paramètres** : Publié, ordre

#### C. Page gestion des devis

**Route** : `/dashboard/portfolio/quotes`

**Vue Kanban** (comme Orders) :
- Colonnes : Nouveau, En cours, Devis envoyé, Accepté, Refusé
- Drag-and-drop pour changer le statut
- Filtres : priorité, urgence, date

**Vue Liste** :
- Tableau avec tri/filtres
- Actions : Voir détails, Envoyer devis, Convertir en facture

**Détail d'un devis** :
- Infos client
- Détails de la demande
- Historique des échanges
- Formulaire de proposition
- Génération PDF devis
- Bouton "Convertir en facture"

#### D. Paramètres du portfolio

**Route** : `/dashboard/portfolio/settings`

**Sections** :
1. **Activation** : Toggle on/off
2. **Branding** : Titre, sous-titre, couleur, cover
3. **Affichage** : Options de vue, pagination
4. **Intégrations** : Système de RDV
5. **Analytics** : Options de tracking

#### E. Analytics et statistiques

**Route** : `/dashboard/portfolio/analytics`

**Métriques** :
- Projets totaux / publiés
- Total de vues
- Projets les plus consultés
- Demandes de devis (total, en attente, converties)
- Taux de conversion devis → facture
- Graphiques d'évolution

**Tableaux** :
- Top 10 projets (par vues)
- Dernières demandes de devis
- Timeline des événements

---

### 5. Intégrations avancées (À faire)

#### A. CRM - Lead Management

**Fonctionnalités** :
- Chaque demande de devis = Lead automatique
- Statut du lead : new, contacted, qualified, proposal_sent, won, lost
- Notes et historique des échanges
- Rappels et tâches
- Scoring de lead (chaud/tiède/froid)

#### B. Conversion Devis → Facture

**Workflow** :
1. Devis accepté par le client
2. Bouton "Convertir en facture"
3. Pré-remplissage de la facture avec :
   - Infos client
   - Services/Lignes du devis
   - Montants
4. Création de la facture via `InvoiceService`
5. Lien `converted_to_invoice_id` dans la table `service_quotes`

#### C. IA - Génération de propositions

**Protocole de Contexte** :
- Utiliser les projets existants comme exemples
- Générer une trame de proposition basée sur :
  - Service demandé
  - Projets similaires réalisés
  - Témoignages pertinents

**Implémentation** (future) :
```typescript
const proposal = await AIService.generateProposal({
  quoteId,
  similarProjects: topProjects,
  testimonials
});
```

---

## 📊 Statistiques et Analytics

### Métriques clés

1. **Engagement** :
   - Vues de projets
   - Clics sur CTA
   - Temps passé sur chaque projet

2. **Conversion** :
   - Nombre de demandes de devis
   - Taux de conversion Visite → Devis
   - Taux de conversion Devis → Facture

3. **Performance** :
   - Projets les plus consultés
   - Catégories les plus populaires
   - Sources de trafic (referrers)

### Dashboard Analytics

**Graphiques** :
- Évolution des vues (7j, 30j, 90j)
- Entonnoir de conversion
- Répartition par catégorie
- Carte géographique des visiteurs

---

## 🎨 Design et UX

### Principes

1. **Cohérence** : Réutiliser les patterns de la Marketplace
2. **Glassmorphism** : Effets glass/blur pour modernité
3. **Responsive** : Mobile-first
4. **Animations** : Framer Motion pour fluidité
5. **Accessibilité** : ARIA labels, focus visible

### Palette de couleurs

- **Primary** : Personnalisable (portfolio_settings.brand_color)
- **Success** : Vert (devis acceptés)
- **Warning** : Orange (devis en attente)
- **Info** : Bleu (nouveaux devis)

---

## 🔒 Sécurité et permissions

### Row-Level Security

- ✅ Propriétaires : accès complet à leurs données
- ✅ Public : lecture des projets publiés uniquement
- ✅ Visiteurs : création de devis sans authentification

### Validation

- **Frontend** : Zod schemas
- **Backend** : Contraintes SQL (CHECK, NOT NULL)

### Uploads

- **Images** : 5MB max, WebP conversion
- **PDF** : 10MB max
- **Vidéos** : URLs externes uniquement (YouTube, Vimeo)

---

## 📱 Responsive Design

### Breakpoints

- **Mobile** : < 640px - Vue liste seule
- **Tablet** : 640px - 1024px - Grid 2 colonnes
- **Desktop** : > 1024px - Grid 3-4 colonnes + masonry

### Navigation mobile

- Bottom sheet pour filtres
- Swipe pour navigation entre projets
- Bouton CTA sticky en bas

---

## 🚀 Roadmap

### Phase 1 : MVP (Actuel) ✅
- ✅ Base de données
- ✅ Service TypeScript
- ✅ Types et interfaces

### Phase 2 : UI Core (À faire)
- [ ] Bouton sur carte
- [ ] Vue Portfolio plein écran
- [ ] Grille de projets
- [ ] Modal détail projet
- [ ] Formulaire devis

### Phase 3 : Dashboard (À faire)
- [ ] Liste projets
- [ ] Formulaire édition
- [ ] Gestion devis
- [ ] Paramètres
- [ ] Analytics basiques

### Phase 4 : Avancé (Future)
- [ ] CRM complet
- [ ] Conversion devis → facture
- [ ] IA - Génération propositions
- [ ] Intégration Calendly/Google Cal
- [ ] Email automation
- [ ] Templates de devis

### Phase 5 : Optimisation (Future)
- [ ] SEO (meta tags par projet)
- [ ] PWA offline
- [ ] Export PDF portfolio
- [ ] Partage social enrichi
- [ ] Analytics avancées

---

## 📚 Documentation technique

### Structure des fichiers

```
src/
├── services/
│   └── portfolioService.ts ✅
├── components/
│   └── portfolio/
│       ├── PortfolioView.tsx
│       ├── ProjectCard.tsx
│       ├── ProjectDetail.tsx
│       ├── QuoteRequestForm.tsx
│       └── PortfolioSettings.tsx
├── pages/
│   └── portfolio/
│       ├── PortfolioManagement.tsx
│       ├── ProjectEdit.tsx
│       └── QuoteManagement.tsx
└── hooks/
    └── usePortfolio.ts

supabase/
└── migrations/
    └── 20251014_create_portfolio_services_tables.sql ✅
```

### Dépendances

- React Query : Gestion état serveur
- Framer Motion : Animations
- React Hook Form + Zod : Formulaires
- Supabase : Backend

---

## 🎯 Indicateurs de succès

1. **Adoption** : % d'utilisateurs activant le portfolio
2. **Engagement** : Moyenne de vues par projet
3. **Conversion** : Taux de devis générés
4. **Revenus** : Montant moyen des devis acceptés

---

## 💡 Exemples de cas d'usage

### Graphiste freelance

**Portfolio** :
- 15 projets (logos, sites web, identités visuelles)
- Catégories : Branding, Web Design, Print
- Témoignages clients intégrés

**Résultats** :
- 500 vues/mois
- 15 demandes de devis/mois
- Taux de conversion : 40%
- Valeur moyenne devis : 2 500€

### Consultant en stratégie

**Portfolio** :
- 8 études de cas (missions passées)
- Format : Défi → Solution → Résultat
- ROI client mis en avant

**Résultats** :
- 200 vues/mois
- 5 demandes de devis/mois
- Taux de conversion : 60%
- Valeur moyenne mission : 15 000€

---

## 🔧 Commandes utiles

### Appliquer la migration
```bash
# Via Supabase CLI
supabase db push

# Ou via Dashboard Supabase
# SQL Editor → Coller le contenu de la migration → Run
```

### Générer des données de test
```sql
-- Décommenter la section "Données de test" dans la migration
```

### Vérifier les tables
```sql
SELECT * FROM portfolio_projects;
SELECT * FROM service_quotes;
SELECT * FROM portfolio_settings;
SELECT * FROM portfolio_analytics;
```

---

## 📞 Support et questions

Pour toute question sur l'implémentation ou suggestion d'amélioration, référez-vous à ce document ou contactez l'équipe technique.

---

**Dernière mise à jour** : 14 octobre 2025
**Version** : 1.0.0 (MVP)
**Statut** : Base de données et Service ✅ | Interface À faire 🚧
