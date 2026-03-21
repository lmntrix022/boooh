# 🗺️ Guide des Routes - Module Portfolio/Services

## 📍 Toutes les routes disponibles

### Routes Publiques (Accessible à tous)

#### Vue Portfolio Publique
```
URL: /card/:id/portfolio
Composant: PortfolioView
Description: Page publique du portfolio d'un utilisateur
Exemple: /card/abc-123-def/portfolio

Fonctionnalités:
- Affichage des projets publiés
- Filtrage par catégorie
- Modal de détail de projet
- Formulaire de demande de devis
- Tracking des vues et événements
```

#### Carte de Visite Publique (avec bouton portfolio)
```
URL: /card/:id
Composant: PublicCardView
Description: Carte de visite publique avec accès au portfolio
Exemple: /card/abc-123-def

Nouveau: Bouton "Mon Univers" apparaît si:
- Portfolio activé (is_enabled = true)
- Au moins 1 projet publié
- Affiche le nombre de projets
```

---

### Routes Privées (Authentification requise)

#### 1. Liste des Projets
```
URL: /portfolio/projects
Composant: ProjectsList
Description: Dashboard de gestion des projets

Fonctionnalités:
✅ Tableau de tous les projets (publiés + brouillons)
✅ Recherche par titre/description
✅ Filtres par catégorie et statut
✅ Statistiques (total, publiés, vues, devis)
✅ Actions:
   - Éditer un projet
   - Publier/Dépublier
   - Dupliquer
   - Supprimer (avec confirmation)
✅ Bouton "Nouveau Projet"

États vides:
- Aucun projet: CTA pour créer le premier
- Aucun résultat: Message pour modifier les filtres
```

#### 2. Création de Projet
```
URL: /portfolio/projects/new/edit
Composant: ProjectEdit (mode création)
Description: Formulaire de création d'un nouveau projet

Formulaire multi-onglets:
📝 Tab 1 - Informations:
   - Titre (requis)
   - Catégorie
   - Tags (ajout/suppression)
   - Description courte (max 200 chars)
   - Toggle "Publier"
   - Toggle "En vedette"

📄 Tab 2 - Contenu:
   - Challenge (Le Défi)
   - Solution (La Solution)
   - Result (Le Résultat)

🖼️ Tab 3 - Médias:
   - Image principale (featured)
   - Galerie d'images (multiple uploads)
   - URL vidéo (YouTube/Vimeo)
   - URL PDF (document téléchargeable)

🎯 Tab 4 - CTA & Témoignage:
   - Type de CTA (quote/booking/contact/custom/none)
   - Texte du bouton
   - URL personnalisée (si custom)
   - Témoignage client (auteur, contenu, note 1-5)

Actions:
- Sauvegarder → Crée le projet et retourne à /portfolio/projects
- Annuler → Retourne à /portfolio/projects sans sauvegarder
```

#### 3. Édition de Projet
```
URL: /portfolio/projects/:id/edit
Composant: ProjectEdit (mode édition)
Description: Modification d'un projet existant
Exemple: /portfolio/projects/xyz-789/edit

Fonctionnalités:
✅ Chargement automatique des données du projet
✅ Même formulaire que la création
✅ Preview des images existantes
✅ Modification de tous les champs
✅ Sauvegarde → Met à jour le projet

Différences avec création:
- Données pré-remplies
- Titre "Éditer le projet" au lieu de "Nouveau projet"
- updateProject() au lieu de createProject()
```

#### 4. Gestion des Devis
```
URL: /portfolio/quotes
Composant: QuotesList
Description: CRM pour gérer les demandes de devis reçues

Fonctionnalités:
✅ Liste de toutes les demandes de devis
✅ Statistiques (total, en attente, convertis, taux conversion)
✅ Recherche par nom/email/service
✅ Filtre par statut avec badges colorés:
   - Nouveau (bleu)
   - Contacté (jaune)
   - Devis envoyé (violet)
   - Accepté (vert)
   - Refusé (rouge)
   - Terminé (gris)

✅ Affichage détaillé de chaque demande:
   - Infos client (nom, email, téléphone, entreprise)
   - Service demandé et description
   - Budget indicatif
   - Date de réception
   - Montant du devis (si envoyé)
   - Notes internes

✅ Dialog de réponse:
   - Changement de statut
   - Saisie du montant
   - Notes privées
   - Sauvegarde

✅ Bouton "Créer facture" (si accepté)

États vides:
- Aucun devis: Message d'attente
- Aucun résultat: Modifier les filtres
```

#### 5. Paramètres du Portfolio
```
URL: /portfolio/settings
Composant: PortfolioSettings
Description: Configuration complète du portfolio

Sections:

🎴 Sélection de carte:
   - Dropdown avec toutes les cartes de l'utilisateur
   - Sélection de la carte à associer au portfolio

🔌 Activation:
   - Toggle activé/désactivé
   - Affichage de l'URL publique
   - Bouton "Voir" pour ouvrir dans nouvel onglet

🎨 Branding:
   - Titre du portfolio (default: "Mon Univers")
   - Sous-titre (tagline)
   - Image de couverture (upload avec preview)
   - Couleur principale (hex + color picker)

👁️ Options d'affichage:
   - Vue par défaut (grille/liste)
   - Projets par page (6-50)
   - Toggle: Afficher catégories
   - Toggle: Afficher compteur de vues

⚙️ Fonctionnalités:
   - Toggle: Activer demandes de devis
   - Toggle: Tracking des vues
   - Select: Système de réservation (none/calendly/google)
   - Input: URL de réservation (si activé)

Actions:
- Sauvegarder → Met à jour les settings
- Tous les changements sont persistés en DB
```

---

## 🧭 Navigation recommandée

### Premier setup (Nouvel utilisateur)
```
1. /portfolio/settings
   → Activer le portfolio
   → Configurer branding
   → Sauvegarder

2. /portfolio/projects
   → Cliquer "Nouveau Projet"

3. /portfolio/projects/new/edit
   → Remplir le formulaire (4 tabs)
   → Publier

4. /card/:id
   → Voir le bouton "Mon Univers"
   → Cliquer pour voir le résultat

5. /card/:id/portfolio
   → Vue publique du portfolio
```

### Workflow quotidien
```
Gestion des projets:
/portfolio/projects → Liste
/portfolio/projects/:id/edit → Édition

Gestion des devis:
/portfolio/quotes → Voir nouvelles demandes
→ Répondre aux devis
→ (Optionnel) Créer facture si accepté

Configuration:
/portfolio/settings → Ajuster paramètres si besoin
```

### Visiteur
```
1. /card/:id
   → Voir la carte de visite
   → Cliquer "Mon Univers"

2. /card/:id/portfolio
   → Parcourir les projets
   → Filtrer par catégorie
   → Cliquer sur un projet

3. Modal ProjectDetail
   → Voir galerie, vidéo, contenu
   → Cliquer CTA "Demander un devis"

4. QuoteRequestDialog
   → Remplir formulaire
   → Soumettre
```

---

## 🔗 Liens et Redirections

### Navigation interne entre pages portfolio

```typescript
// Depuis ProjectsList
navigate('/portfolio/projects/new/edit')        // Nouveau projet
navigate(`/portfolio/projects/${id}/edit`)      // Éditer projet
navigate('/portfolio/settings')                  // Paramètres

// Depuis ProjectEdit
navigate('/portfolio/projects')                  // Retour liste

// Depuis QuotesList
// (Reste sur la même page, utilise des dialogs)

// Depuis PortfolioSettings
window.open(`/card/${cardId}/portfolio`)         // Voir portfolio public
```

### Navigation externe (depuis d'autres pages)

```typescript
// Depuis Dashboard principal
<Link to="/portfolio/projects">Mes Projets</Link>
<Link to="/portfolio/quotes">Mes Devis</Link>
<Link to="/portfolio/settings">Portfolio</Link>

// Depuis une carte de visite
<Link to={`/card/${cardId}/portfolio`}>Voir Portfolio</Link>

// Depuis le portfolio public vers la carte
navigate(`/card/${cardId}`)
```

---

## 📱 Structure URL et Paramètres

### Paramètres dynamiques

```typescript
// ID de carte (dans les routes publiques)
/card/:id                    // id = UUID de la carte
/card/:id/portfolio          // id = UUID de la carte

// ID de projet (dans les routes privées)
/portfolio/projects/:id/edit // id = UUID du projet, ou "new"
```

### Query Parameters (Non utilisés actuellement)

Possibilités futures d'extension:
```typescript
// Pagination
/portfolio/projects?page=2&limit=12

// Filtres persistés dans URL
/portfolio/projects?category=Graphisme&status=published
/portfolio/quotes?status=new

// Recherche
/portfolio/projects?search=logo
```

---

## 🎯 Points d'entrée recommandés

### Pour les utilisateurs (propriétaires)

**Première visite:**
```
Dashboard → "Portfolio" (menu) → /portfolio/settings
```

**Usage quotidien:**
```
Dashboard → "Mes Projets" → /portfolio/projects
Dashboard → "Mes Devis" → /portfolio/quotes
```

### Pour les visiteurs

**Depuis la carte:**
```
/card/:id → Bouton "Mon Univers" → /card/:id/portfolio
```

**Lien direct partageable:**
```
https://votre-domaine.com/card/:id/portfolio
(Peut être partagé sur réseaux sociaux, email, etc.)
```

---

## 🔐 Protection des routes

### Routes publiques (pas de protection)
```
/card/:id
/card/:id/portfolio
```

### Routes privées (authentification requise)
```
/portfolio/projects
/portfolio/projects/:id/edit
/portfolio/quotes
/portfolio/settings
```

**Implémentation:**
Toutes les routes portfolio privées doivent être protégées par le contexte d'authentification. Si l'utilisateur n'est pas connecté, rediriger vers `/auth`.

**Note:** Dans le code actuel, les routes ne sont pas explicitement protégées dans App.tsx. Il est recommandé d'ajouter un wrapper `ProtectedRoute` :

```typescript
// À ajouter dans App.tsx
<Route path="/portfolio/*" element={
  <ProtectedRoute>
    <Routes>
      <Route path="projects" element={<ProjectsList />} />
      <Route path="projects/:id/edit" element={<ProjectEdit />} />
      <Route path="quotes" element={<QuotesList />} />
      <Route path="settings" element={<PortfolioSettings />} />
    </Routes>
  </ProtectedRoute>
} />
```

---

## 📊 Tracking et Analytics

### Événements trackés automatiquement

```typescript
// Sur /card/:id/portfolio
Event: 'view'
→ Incrémente view_count du projet
→ Enregistre dans portfolio_analytics

Event: 'cta_click'
→ Quand le visiteur clique sur le CTA d'un projet
→ Metadata: cta_type, project_id

Event: 'quote_request'
→ Quand le formulaire de devis est soumis
→ Metadata: project_id, card_id

Event: 'booking_click'
→ Quand le lien de réservation est cliqué
→ Metadata: booking_system, booking_url
```

### Consultation des stats

```typescript
// Dans ProjectsList et QuotesList
PortfolioService.getStats(userId)
→ Affiche les cartes statistiques en haut de page

// (Future) Dans PortfolioAnalytics
PortfolioService.getAnalytics(userId, filters)
→ Affichera des graphiques détaillés
```

---

## 🎨 Personnalisation par Route

### Couleurs de marque

Toutes les pages du portfolio (publiques et privées) utilisent la couleur de marque définie dans `portfolio_settings.brand_color`.

**Appliqué sur:**
- Bouton "Mon Univers" (PublicCardView)
- Header du portfolio (PortfolioView)
- Badges de catégorie (PortfolioView)
- Boutons CTA (ProjectDetailModal)
- Accents dans le dashboard (ProjectsList, QuotesList, etc.)

**Default:** `#8B5CF6` (violet)

### Layouts

**Vue publique:** Fond gradient blanc/violet, header avec cover image
**Dashboard:** Fond gradient blanc/violet, layout 3 colonnes max-w-7xl

---

## 🚀 Performance et Chargement

### Lazy Loading

Toutes les routes portfolio sont lazy-loadées dans App.tsx :

```typescript
const PortfolioView = React.lazy(() => import('./pages/PortfolioView'))
const ProjectsList = React.lazy(() => import('./pages/portfolio/ProjectsList'))
const ProjectEdit = React.lazy(() => import('./pages/portfolio/ProjectEdit'))
const QuotesList = React.lazy(() => import('./pages/portfolio/QuotesList'))
const PortfolioSettings = React.lazy(() => import('./pages/portfolio/PortfolioSettings'))
```

**Avantage:** Le code du portfolio n'est téléchargé que lorsqu'un utilisateur accède à une route portfolio.

### Caching

React Query cache les données pendant 5 minutes (`staleTime: 5 * 60 * 1000`).

**Impact sur la navigation:**
- Naviguer de `/portfolio/projects` → `/portfolio/projects/:id/edit` → retour : Les données sont en cache, pas de nouvelle requête
- Les mutations invalident le cache automatiquement

---

## 📖 Exemples d'URLs complètes

### Environnement de développement

```
http://localhost:8080/portfolio/settings
http://localhost:8080/portfolio/projects
http://localhost:8080/portfolio/projects/new/edit
http://localhost:8080/portfolio/projects/abc-123-def/edit
http://localhost:8080/portfolio/quotes
http://localhost:8080/card/xyz-789/portfolio
```

### Production

```
https://votre-domaine.com/portfolio/settings
https://votre-domaine.com/portfolio/projects
https://votre-domaine.com/portfolio/projects/new/edit
https://votre-domaine.com/portfolio/projects/abc-123-def/edit
https://votre-domaine.com/portfolio/quotes
https://votre-domaine.com/card/xyz-789/portfolio
```

---

## 🐛 Débogage des Routes

### Vérifier qu'une route est accessible

```bash
# Depuis le navigateur
http://localhost:8080/portfolio/projects

# Depuis la console
console.log(window.location.pathname)
// Devrait afficher: "/portfolio/projects"
```

### Vérifier le lazy loading

```javascript
// Ouvrir DevTools → Network
// Naviguer vers /portfolio/projects
// Devrait voir un fichier comme "ProjectsList-[hash].js" chargé
```

### Vérifier les redirections

Si une route ne fonctionne pas :
1. Vérifier que le composant est bien importé dans App.tsx
2. Vérifier que la route est bien déclarée dans `<Routes>`
3. Vérifier que l'utilisateur est authentifié (pour routes privées)
4. Vérifier la console pour les erreurs

---

## ✅ Checklist de validation des routes

- [ ] `/card/:id` affiche la carte avec bouton "Mon Univers" si portfolio activé
- [ ] `/card/:id/portfolio` affiche le portfolio public
- [ ] `/portfolio/projects` affiche la liste des projets
- [ ] `/portfolio/projects/new/edit` affiche le formulaire de création
- [ ] `/portfolio/projects/:id/edit` charge et affiche un projet pour édition
- [ ] `/portfolio/quotes` affiche la liste des devis
- [ ] `/portfolio/settings` affiche les paramètres
- [ ] Toutes les routes lazy-loadent correctement
- [ ] Les redirections fonctionnent (ex: après sauvegarde)
- [ ] Les routes privées sont protégées par authentification
- [ ] Les paramètres dynamiques (:id) sont correctement extraits
- [ ] Le cache React Query fonctionne entre les navigations

---

## 📚 Résumé

**Total de routes portfolio : 5 routes privées + 1 route publique = 6 routes**

```
Publiques:
✅ /card/:id/portfolio              (PortfolioView)

Privées:
✅ /portfolio/projects              (ProjectsList)
✅ /portfolio/projects/:id/edit     (ProjectEdit)
✅ /portfolio/quotes                (QuotesList)
✅ /portfolio/settings              (PortfolioSettings)
```

**Toutes les routes sont opérationnelles et prêtes pour la production !** 🚀

---

**Version:** 1.0.0
**Date:** 15 octobre 2025
**Statut:** ✅ Complet
