# 📚 Documentation Bööh

Bienvenue dans la documentation complète de **Bööh** - La plateforme de cartes de visite digitales nouvelle génération.

## 🗂️ Structure de la Documentation

### 📖 Guides Utilisateur

#### [guides/crm/](guides/crm/)
- `guide-complet.md` - Guide complet du CRM
- Documentation du scanner de cartes
- Segmentation RFM et prédictions IA
- Automatisations et workflows

#### [guides/portfolio/](guides/portfolio/)
- `README.md` - Guide Portfolio "Mon Univers"
- Création et gestion de projets
- Système de devis
- Analytics de performance

#### [guides/payment/](guides/payment/)
- Intégration Mobile Money (Airtel/Moov)
- Configuration eBilling
- USSD Push
- Callbacks de paiement

#### [guides/appointments/](guides/appointments/)
- Système de rendez-vous
- Configuration du calendrier
- Notifications automatiques
- Intégration Google Calendar

#### [guides/admin/](guides/admin/)
- Interface d'administration
- Gestion des utilisateurs
- Configuration système

#### [guides/stock/](guides/stock/)
- Gestion de stock
- Mouvements d'inventaire
- Alertes de réapprovisionnement

#### [guides/storage/](guides/storage/)
- Configuration Supabase Storage
- Gestion des médias
- Optimisation des fichiers

---

### ⚙️ Fonctionnalités

#### [features/ecommerce/](features/ecommerce/)
- Système de panier
- Gestion des commandes
- Page "Mes Achats"
- Produits physiques

#### [features/digital-products/](features/digital-products/)
- DRM et protection
- Watermarking
- Téléchargements sécurisés
- Optimisation des icônes

#### [features/invoicing/](features/invoicing/)
- Génération automatique de factures
- Multi-devises
- Export PDF
- Suivi des paiements

#### [features/subscription/](features/subscription/)
- Plans d'abonnement (Free, Business, Magic)
- Quotas et restrictions
- Protection des routes
- Système de choix

#### [features/media/](features/media/)
- Carousels et galeries
- Lecteurs audio/vidéo
- Optimisation d'images

#### [features/analytics/](features/analytics/)
- Statistiques avancées
- Prédictions IA
- Dashboards

#### [features/services/](features/services/)
- Services professionnels
- Cartes de services
- Gestion des prestations

#### [features/quotes/](features/quotes/)
- Système de devis
- Pipeline commercial
- Conversion en factures

#### [features/kanban/](features/kanban/)
- Tableau Kanban
- Gestion de pipeline
- Drag & drop

#### [features/reviews/](features/reviews/)
- Système d'avis clients
- Notes et évaluations
- Modération

#### [features/scanner/](features/scanner/)
- Scanner OCR de cartes
- Détection automatique
- Import de contacts

#### [features/editors/](features/editors/)
- Éditeur HTML rich text
- Formatage avancé
- Prévisualisation

#### [features/themes/](features/themes/)
- Thèmes personnalisables
- Design system
- Templates premium

---

### 🏗️ Architecture

#### [architecture/](architecture/)
- `expert-analysis.md` - Analyse technique complète
- Performance et optimisations
- Bundle optimization
- Structure de la base de données

#### [architecture/security/](architecture/security/)
- Row Level Security (RLS)
- Politiques de sécurité
- Authentification et permissions
- Protection des données

---

### 🚀 Déploiement

#### [deployment/](deployment/)
- Guides de déploiement
- Migrations de base de données
- Configuration des Edge Functions
- Variables d'environnement

---

### 🔌 Intégrations

#### [integration/](integration/)
- Intégrations tierces
- API externes
- Webhooks

#### [integration/social/](integration/social/)
- Spotify
- SoundCloud
- TikTok
- Réseaux sociaux

---

### 🧪 Tests

#### [testing/](testing/)
- Checklist de tests
- Scénarios de test
- Tests E2E

---

### 🛠️ Troubleshooting

#### [troubleshooting/](troubleshooting/)
- Solutions aux erreurs courantes
- Résolution de problèmes
- FAQ technique

---

### 📦 Divers

#### [miscellaneous/](miscellaneous/)
- Fichiers de configuration
- Notes techniques
- Archives

---

## 🚀 Démarrage Rapide

1. **Développement**
   ```bash
   npm install
   npm run dev
   ```

2. **Build Production**
   ```bash
   npm run build
   npm run preview
   ```

3. **Tests**
   ```bash
   npm run test        # Tests unitaires
   npm run test:e2e    # Tests E2E
   ```

4. **Déploiement**
   - Voir [deployment/](deployment/) pour les guides complets

---

## 📊 Stack Technologique

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query + Zustand
- **Animation**: Framer Motion + GSAP
- **Forms**: React Hook Form + Zod

### Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Edge Functions (Deno)

### Maps & Geo
- **Maps**: Mapbox GL / MapLibre GL
- **Clustering**: Supercluster

### Payment
- **Mobile Money**: eBilling (Airtel/Moov Gabon)
- **Integration**: Edge Functions sécurisées

### Media
- **PDF**: jsPDF
- **OCR**: Tesseract.js
- **Images**: Optimisation automatique

---

## 🎯 Fonctionnalités Principales

### ✅ Cartes de Visite Digitales
- Création et personnalisation
- QR codes dynamiques
- Thèmes premium
- Partage multi-canal

### ✅ E-commerce Complet
- Produits physiques et digitaux
- Panier et paiement
- DRM et protection
- Mobile Money

### ✅ CRM Intelligent
- Scanner OCR
- Segmentation RFM
- Prédictions IA
- Automatisations

### ✅ Portfolio Professionnel
- Galerie de projets
- Devis en ligne
- Conversion factures
- Analytics

### ✅ Gestion de Rendez-vous
- Calendrier intelligent
- Disponibilités
- Notifications
- Sync Google Calendar

### ✅ Facturation
- Génération automatique
- Multi-devises
- Export PDF
- Suivi paiements

### ✅ Carte Interactive
- Géolocalisation
- Filtres avancés
- Clustering
- Networking

---

## 💡 Support

- **Documentation**: `/docs/`
- **Issues**: GitHub Issues
- **Architecture**: [architecture/expert-analysis.md](architecture/expert-analysis.md)
- **Changelog**: `/CHANGELOG.md`

---

## 📝 Conventions

### Nomenclature des fichiers
- `guide-*.md` : Guides utilisateur
- `*-implementation.md` : Documentation d'implémentation
- `*-integration.md` : Guides d'intégration
- `README.md` : Index de répertoire

### Structure des guides
1. **Vue d'ensemble**
2. **Prérequis**
3. **Installation/Configuration**
4. **Utilisation**
5. **Exemples**
6. **Troubleshooting**
7. **Références**

---

**Bööh** - Digitalisons l'identité professionnelle 🚀


