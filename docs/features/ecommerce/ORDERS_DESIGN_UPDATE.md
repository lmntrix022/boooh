# Mise à jour du design Orders.tsx

## Modifications à apporter

Le fichier Orders.tsx (1495 lignes) utilise actuellement un design **neomorphism**. Voici les changements clés pour passer au design **glassmorphism premium** conforme aux pages Stats/QR/Appointments :

### 1. Remplacer les variables de style

**Avant (lignes 185-210):**
```typescript
const neuButtonBase = `...`;
const neuCardBase = `...`;
const neuInputBase = `...`;
```

**Après:**
```typescript
// Supprimer ces variables, utiliser les classes Tailwind directement
```

### 2. En-tête Premium (ligne 774-786)

**Avant:**
```tsx
<div className={`p-8 ${neuCardBase}`}>
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        Commandes
      </h1>
      <p className="text-gray-500 mt-2">Gérez vos commandes et leur statut</p>
    </div>
  </div>
</div>
```

**Après:**
```tsx
<motion.div
  className="mb-6"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.1 }}
>
  <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-2">
    <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
      <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
    </span>
    Commandes
  </h1>
  <motion.p
    className="text-lg text-gray-700/80"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.3 }}
  >
    Gérez vos commandes et leur statut
  </motion.p>
</motion.div>
```

### 3. Cartes de statistiques (lignes 790-842)

**Avant:**
```tsx
<motion.div
  className={`p-6 cursor-pointer ${neuCardBase} ${statusFilter === "all" ? "bg-indigo-50/50" : ""}`}
  whileHover={{ scale: 1.04 }}
>
  <div className="flex items-center gap-4 mb-4">
    <motion.div className={`p-3 rounded-xl ${neuButtonBase} bg-indigo-50`}>
      <ShoppingCart className="w-6 h-6 text-indigo-600" />
    </motion.div>
    <div>
      <p className="text-sm font-medium text-gray-500">Total</p>
      <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
    </div>
  </div>
</motion.div>
```

**Après:**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group p-6 cursor-pointer"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 }}
  whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}
  onClick={() => setStatusFilter("all")}
>
  {/* Orbe décoratif */}
  <motion.div
    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />

  <div className="relative z-10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">Total</p>
        <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">{stats.total}</h3>
      </div>
      <div className="h-14 w-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg floating">
        <ShoppingCart className="h-7 w-7 text-white" />
      </div>
    </div>

    {/* Mini graph reste pareil */}
    <div className="h-16 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        ...
      </ResponsiveContainer>
    </div>
  </div>
</motion.div>
```

### 4. Inputs de recherche et filtres

**Avant:**
```tsx
<Input
  className={neuInputBase}
  ...
/>
```

**Après:**
```tsx
<Input
  className="glass border-2 border-gradient-to-r from-purple-400 to-blue-400 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-base px-4 py-3 rounded-xl"
  ...
/>
```

### 5. Toolbar et boutons d'action

Remplacer les `Button` standards par `PremiumButton` avec `rounded-full`.

### 6. Tableau des commandes

**Avant:**
```tsx
<div className={neuCardBase}>
  <Table>
    ...
  </Table>
</div>
```

**Après:**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.3 }}
>
  <motion.div
    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-emerald-400/20 via-green-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />

  <div className="relative z-10">
    <Table>
      ...
    </Table>
  </div>
</motion.div>
```

### 7. État vide

Utiliser le pattern SVG avec gradients :

```tsx
<div className="flex flex-col items-center justify-center py-12">
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
  <p className="text-lg font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2 text-center">
    Aucune commande
  </p>
  <p className="text-gray-500 text-center max-w-xs">
    Vous n'avez pas encore de commandes
  </p>
</div>
```

### 8. Modales de détails

Appliquer le style premium aux modales/dialogs avec:
- Bordures glassmorphism
- Arrondis `rounded-3xl`
- Effets de reflet animé (comme QR Code page)

## Résumé des changements

1. ✅ Supprimer les styles neomorphism (`neuButtonBase`, `neuCardBase`, `neuInputBase`)
2. ✅ Ajouter en-tête premium avec icône gradient et animations
3. ✅ Transformer les cartes stats en glassmorphism avec orbes
4. ✅ Mettre à jour les inputs avec bordures gradient
5. ✅ Remplacer Button par PremiumButton
6. ✅ Ajouter orbes animés aux sections principales
7. ✅ Utiliser gradient-text-3d pour les titres et valeurs importantes
8. ✅ Ajouter états vides avec SVG gradients

## Classes CSS nécessaires

Assurez-vous que ces classes sont disponibles dans votre CSS global:
- `glass-card`
- `card-3d`
- `card-3d-hover`
- `gradient-text-3d`
- `floating`
- `animate-pulse-slow`
- `glass` (pour inputs/tabs)

## Import à ajouter

```typescript
import { PremiumButton } from '@/components/ui/PremiumButton';
```
