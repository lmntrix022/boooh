# Améliorations de la liste des factures

## 📋 Résumé des fonctionnalités ajoutées

Ce document décrit les améliorations apportées à la page `/facture` dans la vue liste, inspirées de la page `/cards/:id/orders`.

## ✅ Fonctionnalités implémentées

### 1. **Sélection multiple des factures**

#### Checkboxes dans le tableau
- ✅ Checkbox dans l'en-tête pour sélectionner/désélectionner toutes les factures
- ✅ Checkbox sur chaque ligne pour sélectionner individuellement
- ✅ Visual feedback : les lignes sélectionnées ont un fond bleu clair
- ✅ Le clic sur la ligne ouvre toujours la facture (onSelect), mais le clic sur la checkbox ne propage pas

#### Interface de sélection
- Badge indiquant le nombre de factures sélectionnées
- Bouton "Désélectionner" pour effacer la sélection
- Affichage dans la barre d'information en bas de la liste

### 2. **Tri du tableau**

Colonnes triables avec icônes visuelles :
- **Client** (alphabétique)
- **Date** (chronologique)
- **Échéance** (chronologique)
- **Montant TTC** (numérique)

Fonctionnement :
- Clic sur l'en-tête pour trier
- Icône `SortAsc` qui apparaît et tourne selon la direction
- Direction alternée : ascendant ⟷ descendant

### 3. **Zone de recherche améliorée**

#### Ligne 1 : Outils principaux
- **Barre de recherche** avec :
  - Icône loupe
  - Placeholder descriptif
  - Bouton X pour effacer la recherche
  - Recherche dans : numéro de facture, nom client, email

- **Bouton "Filtres avancés"** avec :
  - Badge affichant le nombre de filtres actifs
  - Icône Filter
  - Ouvre un panneau latéral (Sheet)

- **Bouton "Exporter"** avec :
  - Icône Download
  - Affiche le nombre de factures sélectionnées `(X)` si applicable
  - Désactivé si aucune facture

#### Ligne 2 : Filtres rapides
- Select **Statut** (Tous, Brouillon, Envoyée, Payée, En retard, Annulée)
- Select **Période** (Toutes, 7 jours, 30 jours, 90 jours)

### 4. **Filtres avancés** (Panneau latéral)

Le Sheet contient :

#### Filtre par statut
- Checkboxes pour tous les statuts disponibles
- Affichage en grille 2 colonnes
- Bordure bleue sur les statuts sélectionnés

#### Plage de dates
- Date de début (input date)
- Date de fin (input date)
- Filtre les factures par date d'émission

#### Montant TTC
- Champ minimum (FCFA)
- Champ maximum (FCFA)
- Filtre les factures par montant

#### Bouton de réinitialisation
- Visible uniquement si des filtres sont actifs
- Efface tous les filtres en un clic

### 5. **Affichage des filtres actifs**

Badges animés sous la barre de recherche :
- **Statuts** : badges bleus
- **Dates** : badges verts
- **Montants** : badges violets
- Bouton X sur chaque badge pour supprimer individuellement
- Animation Framer Motion (fade in/out)

### 6. **Export CSV intelligent**

Comportement :
- Si des factures sont **sélectionnées** → exporte uniquement celles-ci
- Sinon → exporte toutes les factures **filtrées**
- Bouton désactivé si aucune facture disponible

Données exportées :
```csv
N° Facture, Client, Email, Date, Échéance, Montant HT, TVA, Montant TTC, Statut
```

Nom du fichier : `factures_DD-MM-YYYY.csv`

### 7. **Barre d'information en bas**

Affiche :
- Nombre de factures trouvées
- Nombre total si filtres actifs
- Badge avec nombre de factures sélectionnées
- Bouton "Désélectionner tout"

## 🎨 Design

### Style général
- Glass morphism : `glass-card`
- Bordures arrondies : `rounded-xl`
- Couleurs cohérentes : bleu pour les éléments principaux
- Animations Framer Motion pour les transitions

### Interactions
- Hover sur les en-têtes triables : couleur bleue
- Hover sur les lignes : fond bleu clair
- Lignes sélectionnées : fond bleu plus prononcé
- Transitions fluides : `transition-all duration-300`

### Responsive
- Mobile : colonnes empilées
- Desktop : layout horizontal
- Textes masqués sur petits écrans (`hidden sm:inline`)

## 🔄 Logique de filtrage

L'ordre d'application des filtres :
1. Recherche textuelle (numéro, client, email)
2. Filtre statut rapide (select)
3. Filtre période rapide (select)
4. Filtres avancés (statuts multiples)
5. Filtres avancés (plage de dates)
6. Filtres avancés (montant)
7. Tri selon la colonne et direction choisies

## 📝 Notes techniques

### État React
```typescript
const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
const [sortConfig, setSortConfig] = useState({
  key: 'issue_date',
  direction: 'desc'
});
const [advancedFilters, setAdvancedFilters] = useState({
  statuses: [],
  dateRange: { start: null, end: null },
  amountRange: { min: null, max: null }
});
```

### Mémorisation
Utilisation de `useMemo` pour optimiser les performances :
- Filtrage et tri des factures
- Recalcul uniquement si les dépendances changent

### Accessibilité
- Labels appropriés sur les inputs
- Attributs `aria-label` sur les boutons
- Gestion du clavier (Enter, Espace)
- Focus ring visible

## 🚀 Utilisation

### Sélectionner des factures
1. Cocher les factures individuellement
2. Ou cliquer sur la checkbox "Tout sélectionner" dans l'en-tête
3. Le compteur s'affiche automatiquement

### Exporter
1. Sélectionner des factures (optionnel)
2. Cliquer sur "Exporter"
3. Si aucune sélection : exporte toutes les factures filtrées
4. Téléchargement automatique du fichier CSV

### Filtrer
1. Utiliser la recherche pour trouver rapidement
2. Appliquer des filtres rapides (statut, période)
3. Ou ouvrir les filtres avancés pour plus de précision
4. Les badges de filtres actifs permettent de voir en un coup d'œil

### Trier
1. Cliquer sur un en-tête de colonne
2. L'icône apparaît et indique la direction
3. Re-cliquer pour inverser le tri

## 🎯 Améliorations futures possibles

- [ ] Export PDF multi-factures
- [ ] Actions groupées (supprimer, envoyer, etc.)
- [ ] Sauvegarde des préférences de tri/filtres
- [ ] Filtres prédéfinis (favoris)
- [ ] Mode d'affichage compact/étendu
