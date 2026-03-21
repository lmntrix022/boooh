# Système de Design - Pages Stats, Rendez-vous et QR Code

Ce document identifie les éléments clés de design des pages `/cards/:id/stats`, `/cards/:id/rdv` (Appointments), et `/cards/:id/qr` pour application cohérente aux pages products et orders.

## 🎨 Éléments Clés Identifiés

### 1. **Structure d'En-tête**
```tsx
<motion.div
  className="mb-6"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.1 }}
>
  <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-2">
    <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
      <Icon className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
    </span>
    Titre de la Page
  </h1>
  <motion.p
    className="text-lg text-gray-700/80"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.3 }}
  >
    Description de la page
  </motion.p>
</motion.div>
```

**Caractéristiques:**
- Animation Framer Motion avec entrée en fondu + translation Y
- Icône avec badge gradient circulaire
- Titre avec `gradient-text-3d` + `drop-shadow-lg`
- Sous-titre en gris avec opacité
- Classe `floating` pour animation légère

---

### 2. **Cartes Glassmorphism Premium**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
>
  {/* Orbe décoratif animé */}
  <motion.div
    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />
  <CardContent className="pt-8 pb-6 px-6">
    {/* Contenu */}
  </CardContent>
</motion.div>
```

**Caractéristiques:**
- `glass-card` avec effet glassmorphism
- `card-3d` et `card-3d-hover` pour profondeur 3D
- Bordure semi-transparente `border-white/30`
- Coins ultra-arrondis `rounded-3xl`
- Orbe lumineux animé en arrière-plan (blur-3xl)
- Hover avec scale et box-shadow personnalisée
- Groupe pour interactions avancées

---

### 3. **Cartes Statistiques (Overview Cards)**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
>
  <motion.div
    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />
  <CardContent className="pt-8 pb-6 px-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">Label</p>
        <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">Valeur</h3>
      </div>
      <div className="h-14 w-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg floating">
        <Icon className="h-7 w-7 text-white" />
      </div>
    </div>
  </CardContent>
</motion.div>
```

**Layout:**
- Disposition flex avec justify-between
- Icône circulaire avec gradient à droite
- Valeur massive (text-3xl) avec `gradient-text-3d`
- Animation `floating` sur l'icône

---

### 4. **Boutons Premium**
```tsx
<PremiumButton
  variant={condition ? "default" : "outline"}
  className={`rounded-full px-6 py-2 text-base font-bold ${condition ? 'scale-105 shadow-xl' : ''}`}
  onClick={handleClick}
  aria-label="Description"
>
  Texte du bouton
</PremiumButton>
```

**Caractéristiques:**
- Composant `PremiumButton` personnalisé
- Coins arrondis complets `rounded-full`
- État actif avec `scale-105` et `shadow-xl`
- Padding généreux
- Font bold

---

### 5. **Tabs avec Style Premium**
```tsx
<Tabs defaultValue="tab1" value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="glass border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow rounded-full flex justify-center items-center gap-2 p-1 my-6 mx-auto w-fit backdrop-blur-xl">
    <TabsTrigger
      value="tab1"
      className="rounded-full px-6 py-2 gradient-text-3d font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 data-[state=active]:scale-105 data-[state=active]:shadow-lg"
    >
      <Icon className="h-5 w-5" />
      Onglet 1
    </TabsTrigger>
  </TabsList>
  <TabsContent value="tab1" className="p-8 bg-white/70 rounded-2xl">
    {/* Contenu */}
  </TabsContent>
</Tabs>
```

**Caractéristiques:**
- TabsList avec effet glass et backdrop-blur
- Bordure gradient
- Arrondis complets
- TabsTrigger avec icône
- État actif avec scale et shadow
- Contenu avec fond semi-transparent

---

### 6. **Graphiques/Charts avec Orbes**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group max-w-3xl mx-auto"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.4 }}
  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
>
  <motion.div
    className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[30vw] h-[12vw] max-w-lg rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />
  <div className="flex items-center gap-3 px-8 pt-8 pb-2">
    <motion.div
      className="h-12 w-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg floating"
      animate={{ rotate: [0, 8, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Icon className="h-7 w-7 text-white animate-pulse" />
    </motion.div>
    <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
      Titre du graphique
    </h2>
  </div>
  <div className="p-8 pt-2">
    {/* Recharts ou autre graphique */}
  </div>
</motion.div>
```

**Caractéristiques:**
- En-tête avec icône animée (rotate)
- Titre avec gradient text-transparent
- Orbe plus grand pour les sections importantes
- Padding généreux

---

### 7. **État Vide (Empty State)**
```tsx
<div className="flex flex-col items-center justify-center h-72 md:h-96">
  <motion.div
    className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[18vw] h-[8vw] max-w-xs rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
    <circle cx="40" cy="40" r="38" stroke="url(#grad1)" strokeWidth="4" fill="url(#grad2)" />
    <defs>
      <linearGradient id="grad1" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="1" stopColor="#A5B4FC" />
      </linearGradient>
      <radialGradient id="grad2" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
        <stop offset="0%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
      </radialGradient>
    </defs>
  </svg>
  <p className="text-lg font-bold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2 text-center">
    Pas encore de données
  </p>
  <p className="text-gray-500 mb-4 text-center max-w-xs">
    Description de l'état vide
  </p>
  <PremiumButton
    className="rounded-full px-6 py-2 text-base font-bold mt-2"
    onClick={action}
  >
    Action
  </PremiumButton>
</div>
```

**Caractéristiques:**
- Illustration SVG avec gradients
- Orbe lumineux en arrière-plan
- Titre avec gradient text
- CTA avec PremiumButton

---

### 8. **Palette de Couleurs Utilisée**
```javascript
const COLORS = ['#8B5CF6', '#F97316', '#10B981', '#0EA5E9', '#F43F5E', '#EAB308'];
```

**Gradients communs:**
- Violet-Bleu: `from-blue-400 via-purple-400 to-indigo-500`
- Orange-Jaune: `from-orange-400 to-yellow-400`
- Vert-Emeraude: `from-emerald-400 to-green-400`
- Rose-Violet: `from-pink-400 to-rose-500`
- Bleu-Cyan: `from-blue-400 to-cyan-500`

---

### 9. **Animations Framer Motion Communes**

**Entrée de carte:**
```tsx
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, delay: 0.1 }}
```

**Hover de carte:**
```tsx
whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
```

**Orbe pulsant:**
```tsx
animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
```

**Icône rotative:**
```tsx
animate={{ rotate: [0, 8, -8, 0] }}
transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
```

---

### 10. **Classes CSS Personnalisées**

**Glassmorphism:**
- `glass-card`
- `glass` (pour TabsList)
- `backdrop-blur-xl`

**Effets 3D:**
- `card-3d`
- `card-3d-hover`
- `drop-shadow-lg`

**Gradients de texte:**
- `gradient-text-3d`
- `gradient-text`
- `bg-clip-text text-transparent`

**Animations:**
- `floating` (animation légère de flottement)
- `animate-pulse-slow`
- `animate-pulse` (icônes)
- `animate-bounce` (éléments interactifs)

**Effets visuels:**
- `shimmer` (effet de brillance)
- `ripple` (effet d'onde au clic)

---

### 11. **Inputs et Formulaires**
```tsx
<Input
  className="glass border-2 border-gradient-to-r from-purple-400 to-blue-400 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-base px-4 py-3 rounded-xl"
/>

<Textarea
  className="glass border-2 border-gradient-to-r from-purple-400 to-blue-400 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-base px-4 py-3 rounded-xl"
/>
```

**Caractéristiques:**
- Effet glass
- Bordure gradient épaisse
- Ring de focus avec opacité
- Coins arrondis (rounded-xl)
- Padding généreux

---

### 12. **Modal/Dialog Premium (QR Code)**
```tsx
<motion.div
  className="group relative glass-card border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden hover:scale-105 transition-transform duration-300"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: 'easeOut' }}
>
  {/* Reflet animé */}
  <motion.div
    className="pointer-events-none absolute inset-0 rounded-3xl"
    style={{
      background: 'linear-gradient(120deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 60%,transparent 100%)',
      mixBlendMode: 'lighten',
      zIndex: 10
    }}
    animate={{ x: ['-60%', '120%'] }}
    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
  />
  {/* Badge Premium */}
  {isPremium && (
    <motion.div
      className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-30 animate-pulse"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      Premium
    </motion.div>
  )}
</motion.div>
```

**Caractéristiques:**
- Reflet animé avec `mixBlendMode: 'lighten'`
- Badge premium flottant
- Transitions élaborées

---

### 13. **Section de Grille Responsive**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {/* Cartes */}
</div>
```

**Breakpoints:**
- Mobile: 1 colonne
- MD (768px+): 2 colonnes
- LG (1024px+): 3 colonnes
- Gap uniforme de 6 (24px)

---

## 📦 Composants Réutilisables à Créer

Pour unifier le design, créer ces composants:

1. **`PremiumPageHeader`** - En-tête de page standard
2. **`GlassCard`** - Carte glassmorphism avec orbe
3. **`StatCard`** - Carte de statistique
4. **`PremiumTabs`** - Tabs avec style premium
5. **`ChartCard`** - Conteneur pour graphiques
6. **`EmptyState`** - État vide premium
7. **`PremiumInput`** - Input avec style premium
8. **`PremiumDialog`** - Modal avec reflets

---

## 🎯 Application aux Pages Products et Orders

### À Ajouter/Modifier:
1. ✅ En-têtes avec icônes gradient et animations
2. ✅ Cartes glassmorphism avec orbes animés
3. ✅ Boutons PremiumButton au lieu de Button standard
4. ✅ Tabs avec style premium
5. ✅ États vides avec SVG et gradients
6. ✅ Inputs avec bordures gradient
7. ✅ Animations Framer Motion cohérentes
8. ✅ Palette de couleurs unifiée
9. ✅ Classes CSS personnalisées (floating, gradient-text-3d, etc.)

### À Retirer:
- ❌ Styles neomorphism (neuButtonBase, neuCardBase) - remplacer par glassmorphism
- ❌ Styles CSS inline personnalisés (remplacer par classes Tailwind + custom)
- ❌ Cartes plates sans effets
