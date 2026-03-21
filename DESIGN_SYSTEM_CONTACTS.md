# 🎨 Design System - Page Contacts

**Version :** 1.0  
**Date :** Décembre 2025  
**Objectif :** Documenter le design moderne de la page Contacts pour application sur toutes les autres pages

---

## 📋 Table des matières

1. [Principes de design](#principes-de-design)
2. [Header avec titre et icône](#header-avec-titre-et-icône)
3. [Barre d'actions](#barre-dactions)
4. [Cartes de statistiques](#cartes-de-statistiques)
5. [Recherche et filtres](#recherche-et-filtres)
6. [Liste/Grille des éléments](#listegrille-des-éléments)
7. [Vue Kanban](#vue-kanban)
8. [Composants réutilisables](#composants-réutilisables)
9. [Animations](#animations)
10. [Responsive Design](#responsive-design)

---

## 🎯 Principes de design

### Style général
- **Glassmorphism** : `bg-white/X backdrop-blur-2xl` avec transparence
- **Borders** : `border-2 border-gray-200/60` pour un effet subtil
- **Shadows** : `shadow-2xl` pour la profondeur
- **Border radius** : `rounded-3xl` pour les grandes cartes, `rounded-2xl` pour les éléments moyens, `rounded-xl` pour les petits
- **Couleurs** : Palette gris avec accents (gray-900 pour les éléments actifs)

### Typographie
- **Titres principaux** : `text-5xl md:text-6xl lg:text-7xl font-black` avec gradient
- **Sous-titres** : `text-sm md:text-base font-semibold text-gray-600`
- **Textes** : `text-gray-900` pour le contenu principal

---

## 📱 Header avec titre et icône

### Structure
```tsx
<motion.div
  className="relative bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden"
>
  {/* Orbe décoratif animé */}
  <motion.div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400/10 to-indigo-400/10 blur-3xl" />
  
  <div className="relative z-10 p-6 md:p-8">
    <div className="flex items-center gap-6">
      {/* Icon Container */}
      <motion.div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center shadow-2xl border-2 border-gray-800/30">
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      
      {/* Titre avec gradient */}
      <div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          Titre
        </h1>
        <p className="text-sm md:text-base font-semibold text-gray-600 mt-2">
          Sous-titre
        </p>
      </div>
    </div>
  </div>
</motion.div>
```

### Classes CSS principales
- Container : `bg-white/70 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl`
- Icon : `bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900` avec icône blanche
- Titre : `text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent`

---

## ⚡ Barre d'actions

### Structure mobile (une ligne)
```tsx
<div className="flex flex-row items-center gap-2">
  {/* Bouton sélection */}
  <Button className="rounded-xl px-3 py-2.5 bg-white/90 backdrop-blur-xl border-2 border-gray-200/60">
    <Icon className="w-4 h-4" />
  </Button>
  
  {/* Recherche */}
  <div className="flex-1 min-w-0">
    <Input className="pl-10 pr-3 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/60" />
  </div>
  
  {/* Filtre */}
  <Select>
    <SelectTrigger className="w-auto rounded-xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 py-2.5 px-3">
      <Filter className="w-4 h-4" />
    </SelectTrigger>
  </Select>
</div>
```

### Structure desktop
```tsx
<div className="flex flex-col xl:flex-row items-center justify-center xl:justify-between gap-6">
  {/* Actions principales (centrées) */}
  <div className="flex items-center justify-center gap-4">
    {/* Bouton scan avec icône uniquement */}
    <Button className="w-14 h-14 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl">
      <Camera className="w-6 h-6" />
    </Button>
    
    {/* Toggle vues */}
    <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200/50 p-1.5">
      <Button className="rounded-xl px-4 py-2.5">
        <Icon className="w-5 h-5" />
      </Button>
    </div>
  </div>
  
  {/* Actions secondaires (droite) */}
  {selectedItems.size > 0 && (
    <div className="flex items-center gap-3">
      {/* Actions de sélection */}
    </div>
  )}
</div>
```

### Classes CSS principales
- Container : `bg-white/80 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-6 md:p-8`
- Boutons actifs : `bg-gray-900 text-white`
- Boutons inactifs : `text-gray-700 hover:bg-white/60`

---

## 📊 Cartes de statistiques

### Structure
```tsx
<motion.div
  className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden"
>
  {/* Orbe décoratif */}
  <motion.div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-[gradient] blur-3xl opacity-30" />
  
  {/* Reflet animé */}
  <motion.div
    className="absolute inset-0 rounded-3xl pointer-events-none"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
      mixBlendMode: 'overlay'
    }}
  />
  
  <div className="relative z-10 p-6">
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Label
        </p>
        <p className="text-3xl md:text-4xl font-black text-gray-900">
          {value}
        </p>
      </div>
      
      {/* Icon Container - Fond noir avec icône blanche */}
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg border-2 border-gray-800/50">
        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
      </div>
    </div>
    
    {/* Barre de progression décorative */}
    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[gradient] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
      />
    </div>
  </div>
</motion.div>
```

### Classes CSS principales
- Container : `bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl`
- Icon : `bg-gray-900` avec `text-white`
- Gradient par stat : Utiliser des gradients différents pour chaque carte (purple, pink, emerald, amber)

---

## 🔍 Recherche et filtres

### Structure mobile (une ligne)
```tsx
<div className="flex flex-row items-center gap-2">
  {/* Bouton sélection (optionnel) */}
  <Button className="rounded-xl px-3 py-2.5">
    <CheckSquare className="w-4 h-4" />
  </Button>
  
  {/* Recherche */}
  <div className="flex-1 min-w-0">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        placeholder=""
        className="pl-10 pr-3 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 text-sm"
      />
    </div>
  </div>
  
  {/* Filtre avec icône uniquement */}
  <Select>
    <SelectTrigger className="w-auto rounded-xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 py-2.5 px-3">
      <Filter className="w-4 h-4" />
    </SelectTrigger>
  </Select>
</div>
```

### Structure desktop
```tsx
<div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
  {/* Recherche */}
  <div className="flex-1 w-full">
    <Input className="pl-12 pr-4 py-4 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/60" />
  </div>
  
  {/* Bouton sélection */}
  <Button className="rounded-2xl px-5 py-3">
    <CheckSquare className="w-4 h-4 mr-2" />
    <span>Texte</span>
  </Button>
  
  {/* Filtres */}
  <div className="flex gap-3">
    <Select>
      <SelectTrigger className="w-full md:w-48 rounded-2xl py-4 px-4">
        <SelectValue placeholder="Label" />
      </SelectTrigger>
    </Select>
  </div>
</div>
```

### Classes CSS principales
- Container : `bg-white/80 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl p-6 md:p-8`
- Input : `bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 rounded-2xl`
- Select : `bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 rounded-2xl`

---

## 📋 Liste/Grille des éléments

### Structure carte (vue grille)
```tsx
<motion.div
  className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden"
  whileHover={{ scale: 1.03, y: -8 }}
>
  {/* Orbe décoratif */}
  <motion.div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/20 via-indigo-400/20 to-blue-400/20 blur-3xl opacity-0 group-hover:opacity-100" />
  
  {/* Reflet animé */}
  <motion.div
    className="absolute inset-0 rounded-3xl pointer-events-none"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
      mixBlendMode: 'overlay'
    }}
  />
  
  <div className="relative z-10 p-5">
    {/* Contenu */}
  </div>
</motion.div>
```

### Structure liste (vue liste)
```tsx
<motion.div
  className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden"
>
  <div className="relative z-10 p-4">
    <div className="flex items-center gap-4">
      {/* Checkbox */}
      <Checkbox />
      
      {/* Avatar */}
      <Avatar />
      
      {/* Informations principales */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">Titre</h3>
        <p className="text-sm text-gray-600">Sous-titre</p>
      </div>
      
      {/* Actions */}
      <DropdownMenu>
        <MoreVertical className="w-5 h-5" />
      </DropdownMenu>
    </div>
  </div>
</motion.div>
```

### Classes CSS principales
- Container : `bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl`
- Hover : `hover:scale-1.03 hover:-translate-y-2`
- Selected : `ring-4 ring-purple-500/50 bg-purple-50/30 border-purple-300/50`

---

## 📊 Vue Kanban

### Structure colonne
```tsx
<motion.div className="flex flex-col h-full">
  <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
    {/* Orbe décoratif */}
    <motion.div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-[gradient] blur-3xl opacity-30" />
    
    {/* Header de colonne */}
    <div className="relative z-10 p-4 border-b-2 border-gray-200/50">
      <div className="flex items-center gap-3">
        {/* Icon Container - Fond noir avec icône blanche */}
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg border-2 border-gray-800/50">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Titre</h3>
          <p className="text-xs text-gray-600">{count} éléments</p>
        </div>
      </div>
    </div>
    
    {/* Zone droppable */}
    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
      {/* Éléments */}
    </div>
  </div>
</motion.div>
```

### Classes CSS principales
- Container colonne : `bg-white/90 backdrop-blur-2xl rounded-3xl border-2 border-gray-200/60 shadow-2xl`
- Icon header : `bg-gray-900` avec `text-white`
- Gradient par colonne : Utiliser des gradients différents pour chaque colonne

---

## 🧩 Composants réutilisables

### AnimatedOrbs (Background)
```tsx
<AnimatedOrbs />
```
- Composant déjà créé dans `@/components/ui/AnimatedOrbs`
- Ajouter en arrière-plan de la page

### Badge de confiance/statut
```tsx
<Badge className={cn("text-xs font-medium", getColorClass(value))}>
  {value}%
</Badge>
```
- Pas d'emojis, uniquement le texte
- Couleurs : `text-green-600 bg-green-100`, `text-yellow-600 bg-yellow-100`, `text-red-600 bg-red-100`

### Avatar
```tsx
<Avatar className="w-10 h-10 border-2 border-gray-200">
  <AvatarImage src={imageUrl} />
  <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 font-bold">
    {initials}
  </AvatarFallback>
</Avatar>
```

---

## ✨ Animations

### Framer Motion - Entrées
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
>
```

### Hover effects
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>
```

### Stagger animations (liste)
```tsx
<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
```

### Orbes animés
```tsx
<motion.div
  className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/20 via-indigo-400/20 to-blue-400/20 blur-3xl"
  animate={{ 
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
    rotate: [0, 180, 360]
  }}
  transition={{ 
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

### Reflets animés
```tsx
<motion.div
  className="absolute inset-0 rounded-3xl pointer-events-none"
  style={{
    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
    mixBlendMode: 'overlay'
  }}
  animate={{ x: ['-100%', '200%'] }}
  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
/>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : `< 640px` (sm)
- **Tablet** : `640px - 1024px` (md, lg)
- **Desktop** : `> 1024px` (xl, 2xl)

### Patterns responsive

#### Layout flex
```tsx
// Mobile : colonne, Desktop : ligne
<div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
```

#### Tailles de texte
```tsx
// Mobile : petit, Desktop : grand
<h1 className="text-5xl md:text-6xl lg:text-7xl">
```

#### Padding
```tsx
// Mobile : petit, Desktop : grand
<div className="p-6 md:p-8">
```

#### Grilles
```tsx
// Mobile : 1 colonne, Tablet : 2, Desktop : 3
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
```

---

## 🎨 Palette de couleurs

### Couleurs principales
- **Background** : `bg-white/X` avec transparence (70, 80, 90)
- **Borders** : `border-gray-200/60`
- **Text** : `text-gray-900` (principal), `text-gray-600` (secondaire)
- **Active** : `bg-gray-900 text-white`

### Gradients pour statistiques
- **Purple** : `from-purple-500 via-pink-500 to-rose-500`
- **Emerald** : `from-emerald-500 via-teal-500 to-cyan-500`
- **Amber** : `from-amber-500 via-orange-500 to-red-500`
- **Blue** : `from-blue-500 via-indigo-500 to-purple-500`

### Gradients pour Kanban
- **Lead** : `from-blue-500 via-indigo-500 to-purple-500`
- **Prospect** : `from-purple-500 via-pink-500 to-rose-500`
- **Customer** : `from-emerald-500 via-teal-500 to-cyan-500`
- **Inactive** : `from-amber-500 via-orange-500 to-red-500`

---

## 📝 Checklist d'application

Pour appliquer ce design à une nouvelle page :

- [ ] Ajouter `<AnimatedOrbs />` en arrière-plan
- [ ] Créer le header avec icône et titre gradient
- [ ] Implémenter la barre d'actions (mobile : une ligne, desktop : centré)
- [ ] Ajouter les cartes de statistiques avec icônes blanches sur fond noir
- [ ] Créer la section recherche/filtres (mobile : compact, desktop : étendu)
- [ ] Implémenter la vue liste/grille avec glassmorphism
- [ ] Ajouter les animations d'entrée avec framer-motion
- [ ] Appliquer les orbes décoratifs animés
- [ ] Tester le responsive (mobile, tablet, desktop)
- [ ] Vérifier les hover effects et transitions
- [ ] Supprimer tous les emojis, utiliser uniquement des icônes SVG
- [ ] S'assurer que les icônes actives sont blanches sur fond noir

---

## 🔗 Fichiers de référence

- **Page Contacts** : `/src/pages/Contacts.tsx`
- **Composants UI** : `/src/components/ui/`
- **Traductions** : `/src/locales/fr.json` et `/src/locales/en.json`

---

## 📌 Notes importantes

1. **Pas d'emojis** : Utiliser uniquement des icônes SVG de `lucide-react`
2. **Glassmorphism partout** : Tous les conteneurs utilisent `backdrop-blur-2xl`
3. **Animations subtiles** : Privilégier des animations douces et professionnelles
4. **Mobile-first** : Concevoir d'abord pour mobile, puis adapter pour desktop
5. **Cohérence** : Maintenir les mêmes espacements, bordures et ombres partout

---

**Dernière mise à jour :** Décembre 2025  
**Auteur :** Design System Team

