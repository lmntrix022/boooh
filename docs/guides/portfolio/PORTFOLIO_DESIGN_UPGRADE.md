# 🎨 Portfolio Pages - Design System Upgrade

## Vue d'ensemble

Application du design system premium (glassmorphism, animations 3D, orbes) aux pages :
1. `/portfolio/settings` - PortfolioSettings.tsx
2. `/portfolio/projects` - ProjectsList.tsx
3. `/portfolio/projects/new` - ProjectEdit.tsx

**Référence design :** DESIGN_SYSTEM_REFERENCE.md

---

## 📋 Checklist des modifications

### Éléments communs à toutes les pages

- [ ] Header avec animation Framer Motion
- [ ] Icône avec badge gradient circulaire `floating`
- [ ] Titre avec `gradient-text-3d` et `drop-shadow-lg`
- [ ] Cartes avec `glass-card card-3d card-3d-hover`
- [ ] Bordures `border-2 border-white/30`
- [ ] Coins ultra-arrondis `rounded-3xl`
- [ ] Orbes lumineux animés (`blur-3xl`)
- [ ] Boutons `PremiumButton` avec `rounded-full`
- [ ] Background gradient global

---

## 🎯 Page 1 : PortfolioSettings.tsx

### Modifications à appliquer

#### 1. Imports à ajouter

```typescript
import { motion } from 'framer-motion';
import { Settings, Palette, Eye, Globe, Calendar } from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
```

#### 2. Container principal

**REMPLACER :**
```tsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
```

**PAR :**
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-white p-6">
  {/* Orbes décoratifs de fond */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl"
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.5, 0.3, 0.5],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </div>

  <div className="max-w-5xl mx-auto relative z-10">
```

#### 3. Header

**REMPLACER le div avec h1 actuel PAR :**
```tsx
<motion.div
  className="mb-8"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.1 }}
>
  <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-2">
    <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
      <Settings className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
    </span>
    Paramètres Portfolio
  </h1>
  <motion.p
    className="text-lg text-gray-700/80"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.3 }}
  >
    Configurez votre portfolio "Mon Univers" et personnalisez son apparence
  </motion.p>
</motion.div>
```

#### 4. Cards avec glassmorphism

**CHAQUE `<Card>` devient :**
```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative group"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(124,58,237,0.10)' }}
>
  {/* Orbe décoratif */}
  <motion.div
    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
    animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
  />

  <div className="relative z-10">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
        <Palette className="h-6 w-6 text-violet-500" />
        Titre de la section
      </CardTitle>
      <CardDescription className="text-gray-600">
        Description de la section
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Contenu */}
    </CardContent>
  </div>
</motion.div>
```

#### 5. Boutons

**REMPLACER tous les `<Button>` PAR :**
```tsx
<PremiumButton
  variant="default"
  className="rounded-full px-8 py-3 text-base font-bold shadow-xl"
  onClick={handleSubmit(onSubmit)}
  disabled={saveMutation.isPending}
>
  {saveMutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Sauvegarde...
    </>
  ) : (
    <>
      <Save className="mr-2 h-5 w-5" />
      Sauvegarder les paramètres
    </>
  )}
</PremiumButton>
```

#### 6. Upload d'image avec style premium

```tsx
<div className="glass-card border-2 border-dashed border-purple-300/50 rounded-2xl p-8 text-center hover:border-purple-400/70 transition-all duration-300 group cursor-pointer">
  <motion.div
    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-4 floating"
    whileHover={{ scale: 1.1, rotate: 5 }}
  >
    <Upload className="h-8 w-8 text-white" />
  </motion.div>
  <p className="text-lg font-semibold text-gray-700 mb-2">
    Uploader une image de couverture
  </p>
  <p className="text-sm text-gray-500">
    PNG, JPG ou WebP (max 5MB)
  </p>
</div>
```

---

## 🎯 Page 2 : ProjectsList.tsx

### Modifications à appliquer

#### 1. Header avec stats

```tsx
<motion.div
  className="mb-8"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7 }}
>
  <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg mb-4">
    <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
      <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
    </span>
    Mes Projets
  </h1>

  {/* Stats cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <motion.div
      className="glass-card card-3d border-2 border-white/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Total</p>
          <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">{totalProjects}</h3>
        </div>
        <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg floating">
          <Folder className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>

    <motion.div
      className="glass-card card-3d border-2 border-white/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Publiés</p>
          <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">{publishedCount}</h3>
        </div>
        <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg floating">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>

    <motion.div
      className="glass-card card-3d border-2 border-white/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Vues</p>
          <h3 className="text-3xl font-extrabold gradient-text-3d drop-shadow-lg">{totalViews}</h3>
        </div>
        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg floating">
          <Eye className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  </div>
</motion.div>
```

#### 2. Cartes de projet (dans la grille)

```tsx
<motion.div
  className="glass-card card-3d card-3d-hover border-2 border-white/30 shadow-xl rounded-3xl overflow-hidden group cursor-pointer"
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
  whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px 0 rgba(124,58,237,0.15)' }}
>
  {/* Image avec overlay gradient */}
  <div className="relative h-48 overflow-hidden">
    {project.featured_image ? (
      <>
        <img
          src={project.featured_image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </>
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-purple-400/30 via-blue-400/30 to-indigo-400/30 flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-white/40" />
      </div>
    )}

    {/* Badge publié */}
    {project.is_published && (
      <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold shadow-lg">
        ✓ Publié
      </div>
    )}
  </div>

  {/* Contenu */}
  <CardContent className="p-6">
    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
      {project.title}
    </h3>
    {project.category && (
      <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
        <Tag className="h-3 w-3" />
        {project.category}
      </p>
    )}
    {project.short_description && (
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {project.short_description}
      </p>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Eye className="h-3 w-3" />
        <span>{project.view_count || 0} vues</span>
      </div>
      <div className="flex gap-2">
        <PremiumButton
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => navigate(`/portfolio/projects/${project.id}/edit`)}
        >
          <Edit2 className="h-4 w-4" />
        </PremiumButton>
        <PremiumButton
          variant="ghost"
          size="sm"
          className="rounded-full text-red-500 hover:text-red-600"
          onClick={() => handleDelete(project.id)}
        >
          <Trash2 className="h-4 w-4" />
        </PremiumButton>
      </div>
    </div>
  </CardContent>
</motion.div>
```

#### 3. État vide

```tsx
<motion.div
  className="glass-card border-2 border-dashed border-purple-300/50 rounded-3xl p-12 text-center"
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5 }}
>
  <motion.div
    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full mb-6"
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <FolderOpen className="h-10 w-10 text-purple-400" />
  </motion.div>
  <h3 className="text-2xl font-bold text-gray-700 mb-2">
    Aucun projet pour le moment
  </h3>
  <p className="text-gray-500 mb-6">
    Créez votre premier projet pour commencer à construire votre portfolio
  </p>
  <PremiumButton
    onClick={() => navigate('/portfolio/projects/new')}
    className="rounded-full px-8 py-3"
  >
    <Plus className="mr-2 h-5 w-5" />
    Créer mon premier projet
  </PremiumButton>
</motion.div>
```

---

## 🎯 Page 3 : ProjectEdit.tsx

### Modifications à appliquer

#### 1. Header avec navigation

```tsx
<motion.div
  className="mb-8 flex items-center justify-between"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7 }}
>
  <div className="flex items-center gap-4">
    <PremiumButton
      variant="ghost"
      onClick={() => navigate('/portfolio/projects')}
      className="rounded-full"
    >
      <ArrowLeft className="h-5 w-5" />
    </PremiumButton>
    <div>
      <h1 className="flex items-center gap-3 gradient-text-3d text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
        <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 p-2 shadow-lg floating">
          <Edit className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow" />
        </span>
        {isEditMode ? 'Éditer le projet' : 'Nouveau projet'}
      </h1>
      <p className="text-lg text-gray-700/80 mt-1">
        {isEditMode ? 'Modifiez les informations de votre projet' : 'Créez un nouveau projet pour votre portfolio'}
      </p>
    </div>
  </div>

  <div className="flex gap-2">
    <PremiumButton
      variant="outline"
      onClick={() => navigate('/portfolio/projects')}
      className="rounded-full"
    >
      Annuler
    </PremiumButton>
    <PremiumButton
      onClick={handleSubmit(onSubmit)}
      disabled={saveMutation.isPending}
      className="rounded-full px-6"
    >
      {saveMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sauvegarde...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </>
      )}
    </PremiumButton>
  </div>
</motion.div>
```

#### 2. Tabs avec style premium

```tsx
<Tabs defaultValue="info" className="w-full">
  <TabsList className="glass border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-xl rounded-full flex justify-center items-center gap-2 p-1 my-6 mx-auto w-fit backdrop-blur-xl">
    <TabsTrigger
      value="info"
      className="rounded-full px-6 py-2 gradient-text-3d font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:bg-white/80"
    >
      <Info className="h-4 w-4" />
      Informations
    </TabsTrigger>
    <TabsTrigger
      value="content"
      className="rounded-full px-6 py-2 gradient-text-3d font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:bg-white/80"
    >
      <FileText className="h-4 w-4" />
      Contenu
    </TabsTrigger>
    <TabsTrigger
      value="media"
      className="rounded-full px-6 py-2 gradient-text-3d font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:bg-white/80"
    >
      <Image className="h-4 w-4" />
      Médias
    </TabsTrigger>
    <TabsTrigger
      value="cta"
      className="rounded-full px-6 py-2 gradient-text-3d font-semibold flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:bg-white/80"
    >
      <MessageSquare className="h-4 w-4" />
      CTA & Témoignage
    </TabsTrigger>
  </TabsList>

  {/* TabsContent avec glassmorphism */}
  <TabsContent value="info">
    <motion.div
      className="glass-card card-3d border-2 border-white/30 shadow-2xl rounded-3xl overflow-hidden relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Orbe */}
      <motion.div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-white/0 blur-3xl opacity-30 z-0"
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Informations générales
          </CardTitle>
          <CardDescription>
            Titre, catégorie, et description du projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          {/* Champs du formulaire */}
        </CardContent>
      </div>
    </motion.div>
  </TabsContent>
</Tabs>
```

---

## 🎨 Classes CSS à ajouter dans globals.css

```css
/* Gradient text 3D */
.gradient-text-3d {
  @apply bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Glass card effect */
.glass-card {
  @apply bg-white/70 backdrop-blur-xl;
}

/* 3D card effects */
.card-3d {
  transform-style: preserve-3d;
  transform: perspective(1000px);
}

.card-3d-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-3d-hover:hover {
  transform: perspective(1000px) rotateX(2deg) rotateY(2deg);
}

/* Floating animation */
@keyframes floating {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.floating {
  animation: floating 3s ease-in-out infinite;
}

/* Pulse slow */
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.animate-pulse-slow {
  animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## ✅ Résumé des changements

### Pour chaque page :

1. **Background** : Gradient + orbes de fond animés
2. **Header** : Animation Framer Motion + icône gradient + titre 3D
3. **Cards** : Glassmorphism + orbe par carte + hover 3D
4. **Boutons** : PremiumButton + rounded-full
5. **Tabs** (ProjectEdit) : Style premium avec border gradient
6. **Upload zones** : Glass effect + animations hover
7. **Stats** (ProjectsList) : Cards avec icônes gradient circulaires
8. **Empty states** : Animations + appel à l'action clair

**Temps d'implémentation estimé :** 2-3 heures pour les 3 pages

**Résultat attendu :** Design cohérent, moderne, premium avec toutes les pages portfolio alignées sur le design system global.
