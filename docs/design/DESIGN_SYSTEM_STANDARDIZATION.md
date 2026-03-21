# 🎨 STANDARDISATION DU DESIGN SYSTEM

**Objectif :** Uniformiser le design de toutes les pages selon le modèle des pages sources (Stats, AppointmentManager, QrCode).

---

## 📐 DESIGN SYSTEM DE RÉFÉRENCE

### **Pages sources (référence à suivre) :**
- ✅ `/cards/:id/stats` - [Stats.tsx](src/pages/Stats.tsx)
- ✅ `/cards/:id/appointment-manager` - [AppointmentManager.tsx](src/pages/AppointmentManager.tsx)
- ✅ `/cards/:id/qr` - [QrCode.tsx](src/pages/QrCode.tsx)

### **Pages cibles (à standardiser) :**
- ❌ `/profile` - [Profile.tsx](src/pages/Profile.tsx)
- ❌ `/contacts` - [Contacts.tsx](src/pages/Contacts.tsx)
- ❌ `/stock` - [Stock.tsx](src/pages/Stock.tsx)

---

## 🎯 STRUCTURE DE PAGE STANDARDISÉE

Toutes les pages DOIVENT suivre cette structure exacte :

```tsx
<DashboardLayout>
  <div className="container max-w-7xl py-6 px-4 md:px-6">

    {/* 1. HEADER PREMIUM */}
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
        Titre de la page
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

    {/* 2. CONTENU PRINCIPAL */}
    {/* Cards avec glass-card card-3d card-3d-hover */}

  </div>
</DashboardLayout>
```

---

## 🏗️ COMPOSANTS STANDARDISÉS

### 1️⃣ **HEADER PREMIUM (PageHeader)**

**Anatomie complète :**

```tsx
// Composant réutilisable à créer : src/components/ui/PageHeader.tsx
interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconGradient?: string; // Optionnel, défaut: "from-blue-400 via-purple-400 to-indigo-500"
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  description,
  iconGradient = "from-blue-400 via-purple-400 to-indigo-500"
}) => (
  <motion.div
    className="mb-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.1 }}
  >
    <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-2">
      <span className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} p-2 shadow-lg floating`}>
        <Icon className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
      </span>
      {title}
    </h1>
    <motion.p
      className="text-lg text-gray-700/80"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      {description}
    </motion.p>
  </motion.div>
);
```

**Usage :**
```tsx
// Dans Stats.tsx (référence)
<PageHeader
  icon={BarChart}
  title="Statistiques"
  description={`Analysez les performances de votre carte de visite ${card?.name ? `"${card.name}"` : ''}`}
/>

// Dans Profile.tsx (à appliquer)
<PageHeader
  icon={User}
  title="Mon Profil"
  description="Gérez vos informations personnelles et paramètres"
/>

// Dans Contacts.tsx (à appliquer)
<PageHeader
  icon={Users}
  title="Mes Contacts"
  iconGradient="from-emerald-400 via-green-400 to-teal-500"
  description="Gérez vos contacts scannés et importés"
/>

// Dans Stock.tsx (à appliquer)
<PageHeader
  icon={Package}
  title="Gestion de Stock"
  iconGradient="from-purple-400 via-indigo-400 to-blue-500"
  description="Gérez votre inventaire et suivez vos stocks"
/>
```

---

### 2️⃣ **STAT CARD PREMIUM (StatCard)**

**Anatomie complète :**

```tsx
// Composant réutilisable à créer : src/components/ui/StatCard.tsx
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconGradient?: string;
  iconBgColor?: string; // Couleur de fond de l'icône
  delay?: number; // Délai d'animation
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  iconGradient = "from-purple-400 to-indigo-500",
  iconBgColor = "bg-gradient-to-br",
  delay = 0.1
}) => (
  <motion.div
    className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
  >
    {/* Orbe décoratif animé */}
    <motion.div
      className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
      animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    />
    <CardContent className="pt-8 pb-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">{value}</h3>
        </div>
        <div className={`h-14 w-14 ${iconBgColor} ${iconGradient} rounded-full flex items-center justify-center shadow-lg floating`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </CardContent>
  </motion.div>
);
```

**Usage (Référence Stats.tsx ligne 224-305) :**
```tsx
// Grille de stats
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <StatCard
    icon={Eye}
    label="Vues totales"
    value={views.length}
    iconGradient="from-purple-400 to-indigo-500"
    delay={0.1}
  />
  <StatCard
    icon={Calendar}
    label="Vues / jour"
    value={(views.length / (dateRange || 1)).toFixed(1)}
    iconGradient="from-orange-400 to-yellow-400"
    delay={0.2}
  />
  <StatCard
    icon={TrendingUp}
    label="Tendance"
    value={views.length > 0 ? <TrendingUp className="h-7 w-7 text-emerald-400 animate-bounce" /> : "--"}
    iconGradient="from-emerald-400 to-green-400"
    delay={0.3}
  />
</div>
```

---

### 3️⃣ **GLASS CARD CONTENT (ContentCard)**

**Anatomie complète :**

```tsx
// Composant réutilisable à créer : src/components/ui/ContentCard.tsx
interface ContentCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay?: number;
  maxWidth?: string; // Par défaut "max-w-3xl"
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  icon: Icon,
  children,
  delay = 0.4,
  maxWidth = "max-w-3xl"
}) => (
  <motion.div
    className={`glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group ${maxWidth} mx-auto`}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay }}
    whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
  >
    {/* Orbe décoratif animé */}
    <motion.div
      className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[30vw] h-[12vw] max-w-lg rounded-full bg-gradient-to-br from-blue-400/20 via-violet-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
      animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    />

    <div className="flex items-center gap-3 px-8 pt-8 pb-2">
      {Icon && (
        <motion.div
          className="h-12 w-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg floating"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="h-7 w-7 text-white animate-pulse" />
        </motion.div>
      )}
      <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg">
        {title}
      </h2>
    </div>

    <div className="p-8 pt-2">
      {children}
    </div>
  </motion.div>
);
```

**Usage (Référence Stats.tsx ligne 393-483) :**
```tsx
<ContentCard
  title="Statistiques détaillées"
  icon={BarChart}
  delay={0.4}
>
  {/* Contenu du graphique */}
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</ContentCard>
```

---

### 4️⃣ **BOUTONS PREMIUM (PremiumButton)**

**Utiliser le composant existant :**
```tsx
import { PremiumButton } from "@/components/ui/PremiumButton";

// Bouton principal avec gradient
<PremiumButton
  variant="default"
  className="rounded-full px-6 py-2 text-base font-bold shadow-xl hover:shadow-2xl"
  onClick={handleAction}
>
  <Icon className="w-4 h-4 mr-2" />
  Action principale
</PremiumButton>

// Bouton secondaire outline
<PremiumButton
  variant="outline"
  className="rounded-full px-6 py-2 text-base font-bold"
  onClick={handleAction}
>
  Action secondaire
</PremiumButton>
```

**Ou créer des boutons avec gradients custom :**
```tsx
<Button
  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-xl ripple focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
>
  <Icon className="w-4 h-4 mr-2" />
  Texte du bouton
</Button>
```

---

### 5️⃣ **ORBES DE FOND (AnimatedOrbs)**

**Composant réutilisable à créer : src/components/ui/AnimatedOrbs.tsx**

```tsx
import { motion } from 'framer-motion';

export const AnimatedOrbs: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Orbe principal central */}
    <motion.div
      className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-[30vw] max-w-2xl rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-40"
      animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Orbe secondaire bas-droite */}
    <motion.div
      className="absolute bottom-0 right-0 w-1/3 h-1/4 bg-gradient-to-tr from-black/20 to-transparent blur-2xl opacity-20"
      animate={{ y: [0, 20, 0], opacity: [0.2, 0.3, 0.2] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Orbe tertiaire gauche */}
    <motion.div
      className="absolute top-1/3 left-0 w-1/4 h-1/4 bg-gradient-to-br from-purple-400/20 to-blue-400/10 blur-2xl opacity-30"
      animate={{ x: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);
```

**Usage dans les pages :**
```tsx
<DashboardLayout>
  <div className="relative min-h-screen">
    <AnimatedOrbs />

    <div className="container max-w-7xl py-6 px-4 md:px-6 relative z-10">
      {/* Contenu de la page */}
    </div>
  </div>
</DashboardLayout>
```

---

## 📊 COMPARAISON DÉTAILLÉE PAR PAGE

### 🟢 **STATS.TSX (Référence parfaite)**

**Structure actuelle :**
```tsx
<DashboardLayout>
  <div className="container max-w-5xl py-6 px-4 md:px-6">
    {/* ✅ Header premium parfait */}
    <motion.div className="mb-6" {...animations}>
      <h1 className="flex items-center gap-3 gradient-text-3d ...">
        <span className="inline-flex ... bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 ...">
          <BarChart className="..." />
        </span>
        Statistiques
      </h1>
      <motion.p className="text-lg text-gray-700/80" {...animations}>
        Description
      </motion.p>
    </motion.div>

    {/* ✅ Boutons filtres premium */}
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      <PremiumButton variant={...} className="rounded-full px-6 py-2 text-base font-bold ...">
        7 jours
      </PremiumButton>
    </div>

    {/* ✅ Grid de stat cards avec orbes */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <motion.div className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl ...">
        <motion.div className="... blur-3xl opacity-30 animate-pulse-slow ..." {...orbAnimation} />
        <CardContent className="pt-8 pb-6 px-6">
          {/* Contenu */}
        </CardContent>
      </motion.div>
    </div>

    {/* ✅ Content cards avec orbes */}
    <motion.div className="glass-card card-3d card-3d-hover ... max-w-3xl mx-auto">
      <motion.div className="... blur-3xl ..." {...orbAnimation} />
      <div className="flex items-center gap-3 px-8 pt-8 pb-2">
        <motion.div className="... bg-gradient-to-br from-violet-500 to-blue-500 ... floating">
          <Icon className="... animate-pulse" />
        </motion.div>
        <h2 className="... bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent ...">
          Titre
        </h2>
      </div>
      <div className="p-8 pt-2">
        {/* Contenu */}
      </div>
    </motion.div>
  </div>
</DashboardLayout>
```

---

### 🟡 **PROFILE.TSX (Partiellement conforme)**

**Problèmes identifiés :**

| Élément | État actuel | Attendu (Stats.tsx) | Action |
|---------|------------|-------------------|--------|
| Container | ❌ `max-w-4xl` | ✅ `max-w-5xl` ou `max-w-7xl` | Modifier |
| Header | ❌ Simple h1 sans badge | ✅ Header premium avec badge gradient + `gradient-text-3d` | **Remplacer** |
| Background | ✅ `bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60` | ✅ Correct MAIS manque orbes animés | **Ajouter AnimatedOrbs** |
| Cards principales | ✅ `glass-card` | ❌ Manque `card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl` | **Compléter classes** |
| Stats cards | ❌ Pas de stats cards | ✅ Grid de StatCard avec orbes | **Ajouter** (optionnel) |
| Boutons | ❌ `bg-gradient-to-r from-blue-500 to-indigo-500` (correct) mais sans `shadow-xl ripple` | ✅ Avec `shadow-xl ripple focus:ring-2` | **Compléter classes** |
| Orbes dans cards | ❌ Absents | ✅ Orbes animés dans chaque card importante | **Ajouter** |

**Code à modifier (Profile.tsx ligne 345-452) :**

```tsx
// AVANT (actuel)
<div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60 backdrop-blur-2xl py-8 px-4">
  <div className="max-w-4xl mx-auto space-y-8">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
      <Card className="glass-card border-blue-200/40 overflow-hidden">
        {/* Contenu */}
      </Card>
    </motion.div>
  </div>
</div>

// APRÈS (standardisé)
<div className="relative min-h-screen">
  <AnimatedOrbs />

  <div className="container max-w-5xl py-6 px-4 md:px-6 relative z-10">

    {/* Header premium */}
    <PageHeader
      icon={User}
      title="Mon Profil"
      description="Gérez vos informations personnelles et paramètres"
    />

    {/* Card principale */}
    <motion.div
      className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
    >
      <motion.div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <CardContent className="p-8">
        {/* Contenu existant */}
      </CardContent>
    </motion.div>
  </div>
</div>
```

---

### 🔴 **CONTACTS.TSX (Non conforme)**

**Problèmes identifiés :**

| Élément | État actuel | Attendu | Action |
|---------|------------|---------|--------|
| Container | ✅ `max-w-7xl` | ✅ Correct | Aucune |
| Header | ❌ Simple `<h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">` | ✅ Header premium | **REMPLACER ENTIÈREMENT** |
| Background | ✅ `bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60` | ✅ Correct MAIS manque orbes | **Ajouter AnimatedOrbs** |
| Stats cards | ✅ `glass-card border-blue-200/40` | ❌ Manque `card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl` + orbes | **Remplacer** |
| Contact cards | ✅ `glass-card border-gray-200/40` | ❌ Manque `card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl` | **Remplacer** |
| Boutons | ❌ `bg-gradient-to-r from-blue-500 to-indigo-500` sans `shadow-xl ripple` | ✅ Complet avec effets | **Compléter** |

**Code à modifier (Contacts.tsx ligne 467-549) :**

```tsx
// AVANT (ligne 472-483)
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">Mes Contacts</h1>
    <p className="text-sm md:text-base text-blue-600">Gérez vos contacts scannés et importés</p>
  </div>
</motion.div>

// APRÈS (standardisé)
<PageHeader
  icon={Users}
  title="Mes Contacts"
  iconGradient="from-emerald-400 via-green-400 to-teal-500"
  description="Gérez vos contacts scannés et importés"
/>

// AVANT (ligne 552-613 - Stats cards)
<Card className="glass-card border-blue-200/40">
  <CardContent className="p-3 md:p-6">
    <div className="flex items-center gap-2 md:gap-4">
      <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
        <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
      </div>
      <div>
        <p className="text-lg md:text-2xl font-bold text-blue-900">{stats.total}</p>
        <p className="text-blue-600 text-xs md:text-sm">Total contacts</p>
      </div>
    </div>
  </CardContent>
</Card>

// APRÈS (standardisé)
<StatCard
  icon={Users}
  label="Total contacts"
  value={stats.total}
  iconGradient="from-blue-400 to-cyan-500"
  delay={0.1}
/>
```

---

### 🔴 **STOCK.TSX (Non conforme)**

**Problèmes identifiés :**

| Élément | État actuel | Attendu | Action |
|---------|------------|---------|--------|
| Container | ✅ `max-w-7xl` | ✅ Correct | Aucune |
| Header | ❌ Simple `<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">` | ✅ Header premium | **REMPLACER** |
| Background | ✅ `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50` | ✅ Correct MAIS manque orbes | **Ajouter AnimatedOrbs** |
| Stats cards | ❌ `bg-white/70 backdrop-blur-sm border-blue-200` | ✅ `glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl` + orbes | **REMPLACER** |
| Product cards | ❌ `bg-white/70 backdrop-blur-sm border-blue-200` | ✅ Même chose | **REMPLACER** |
| Boutons | ❌ `bg-gradient-to-r from-blue-500 to-indigo-500` sans `shadow-xl ripple` | ✅ Complet | **Compléter** |

**Code à modifier (Stock.tsx ligne 447-471) :**

```tsx
// AVANT (ligne 452-461)
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  <div>
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
      Gestion de Stock
    </h1>
    <p className="text-gray-600 text-lg">
      Gérez votre inventaire et suivez vos stocks
    </p>
  </div>
</div>

// APRÈS (standardisé)
<PageHeader
  icon={Package}
  title="Gestion de Stock"
  iconGradient="from-purple-400 via-indigo-400 to-blue-500"
  description="Gérez votre inventaire et suivez vos stocks"
/>

// AVANT (ligne 474-485 - Stats cards)
<Card className="bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
  <CardContent className="p-4 md:p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">Total Articles</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <Package className="w-8 h-8 text-blue-500" />
    </div>
  </CardContent>
</Card>

// APRÈS (standardisé)
<StatCard
  icon={Package}
  label="Total Articles"
  value={stats.total}
  iconGradient="from-blue-400 to-indigo-500"
  delay={0.1}
/>
```

---

## 🚀 PLAN DE MIGRATION

### **Phase 1 : Créer les composants réutilisables**

1. Créer `src/components/ui/PageHeader.tsx`
2. Créer `src/components/ui/StatCard.tsx`
3. Créer `src/components/ui/ContentCard.tsx`
4. Créer `src/components/ui/AnimatedOrbs.tsx`
5. Vérifier que `PremiumButton.tsx` existe et est complet

### **Phase 2 : Standardiser Profile.tsx**

1. ✅ Remplacer le header par `<PageHeader>`
2. ✅ Ajouter `<AnimatedOrbs />` en background
3. ✅ Modifier container : `max-w-4xl` → `max-w-5xl`
4. ✅ Compléter les classes des cards : ajouter `card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl`
5. ✅ Ajouter orbes animés dans les cards principales
6. ✅ Compléter les classes des boutons : ajouter `shadow-xl ripple focus:ring-2`

### **Phase 3 : Standardiser Contacts.tsx**

1. ✅ Remplacer le header (ligne 479-482) par `<PageHeader>`
2. ✅ Ajouter `<AnimatedOrbs />` en background
3. ✅ Remplacer les 4 stats cards (ligne 552-613) par `<StatCard>`
4. ✅ Modifier les contact cards : remplacer `glass-card border-gray-200/40` par `glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl`
5. ✅ Compléter les boutons

### **Phase 4 : Standardiser Stock.tsx**

1. ✅ Remplacer le header (ligne 452-461) par `<PageHeader>`
2. ✅ Ajouter `<AnimatedOrbs />` en background
3. ✅ Remplacer les 5 stats cards (ligne 474-536) par `<StatCard>`
4. ✅ Modifier les product cards : remplacer `bg-white/70 backdrop-blur-sm` par `glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl`
5. ✅ Compléter les boutons

---

## 📝 CHECKLIST FINALE

### **Composants créés :**
- [ ] PageHeader.tsx
- [ ] StatCard.tsx
- [ ] ContentCard.tsx
- [ ] AnimatedOrbs.tsx
- [ ] PremiumButton.tsx (vérifier/compléter)

### **Profile.tsx standardisé :**
- [ ] Header premium
- [ ] AnimatedOrbs
- [ ] Container max-w-5xl
- [ ] Cards avec orbes
- [ ] Boutons premium

### **Contacts.tsx standardisé :**
- [ ] Header premium
- [ ] AnimatedOrbs
- [ ] Stats cards remplacées
- [ ] Contact cards améliorées
- [ ] Boutons premium

### **Stock.tsx standardisé :**
- [ ] Header premium
- [ ] AnimatedOrbs
- [ ] Stats cards remplacées
- [ ] Product cards améliorées
- [ ] Boutons premium

---

## ✅ RÉSULTAT ATTENDU

**Après migration, toutes les pages auront :**

1. ✅ **Même header** : Icône gradient + titre `gradient-text-3d` + description animée
2. ✅ **Mêmes cards** : `glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl`
3. ✅ **Mêmes stats cards** : Grid uniforme avec orbes animés + icônes floating
4. ✅ **Mêmes boutons** : Gradients + `shadow-xl ripple focus:ring-2`
5. ✅ **Mêmes orbes** : Background animé identique partout
6. ✅ **Mêmes animations** : Framer Motion avec delays cohérents

**= DESIGN SYSTEM UNIFIÉ ET COHÉRENT**
