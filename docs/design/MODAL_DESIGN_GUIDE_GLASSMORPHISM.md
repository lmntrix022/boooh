# Guide de Design des Modales avec Glassmorphism - Booh

## Vue d'ensemble

Ce document définit les standards de design **premium avec effet glassmorphism** pour toutes les modales (Dialog/AlertDialog) de l'application. Le glassmorphism offre une esthétique moderne et élégante tout en maintenant une lisibilité optimale.

## Principe du Glassmorphism

Le glassmorphism combine:
- **Transparence** avec arrière-plans semi-transparents
- **Flou d'arrière-plan** (backdrop-blur)
- **Bordures lumineuses** semi-transparentes
- **Ombres prononcées** pour la profondeur
- **Contraste du texte** pour la lisibilité

## Standards de Design

### 1. DialogContent / AlertDialogContent (Conteneur Principal)

```tsx
<DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl">
```

**Classes obligatoires:**
- `bg-white/95` - Arrière-plan blanc à 95% d'opacité (lisible mais élégant)
- `backdrop-blur-xl` - Flou d'arrière-plan extra-large pour l'effet verre
- `border-2 border-white/40` - Bordure épaisse semi-transparente
- `shadow-2xl` - Ombre profonde pour élévation
- `rounded-2xl` ou `rounded-3xl` - Coins arrondis

**Variantes par contexte:**
```tsx
// Modal standard (info/édition)
className="bg-white/95 backdrop-blur-xl border-2 border-blue-200/50 shadow-2xl"

// Modal de confirmation
className="bg-white/95 backdrop-blur-xl border-2 border-yellow-200/50 shadow-2xl"

// Modal de suppression
className="bg-white/95 backdrop-blur-xl border-2 border-red-200/50 shadow-2xl"

// Modal premium avec animation
className="glass-card border-2 border-white/30 shadow-2xl rounded-3xl"
```

### 2. DialogHeader

```tsx
<DialogHeader>
  <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
    <Icon className="h-5 w-5 text-blue-600" />
    Titre de la Modale
  </DialogTitle>
  <DialogDescription className="text-gray-700">
    Description avec <strong className="text-gray-900">emphase</strong>
  </DialogDescription>
</DialogHeader>
```

**Règles:**
- Titre: `text-gray-900 font-bold` - Texte très foncé et gras
- Icône dans titre: Couleur thématique (`text-blue-600`, `text-red-600`, etc.)
- Description: `text-gray-700` - Texte moyen pour différenciation
- Emphases: `text-gray-900 font-medium`

### 3. Labels (Étiquettes)

```tsx
<Label htmlFor="input-id" className="text-gray-900 font-medium">
  Nom du champ
</Label>

// Avec gradient premium
<Label htmlFor="input-id" className="font-semibold gradient-text-3d">
  Nom du champ Premium
</Label>
```

**Règles:**
- Standard: `text-gray-900 font-medium`
- Premium: `font-semibold gradient-text-3d`

### 4. Inputs & Textarea (Effet Glassmorphism)

```tsx
<Input
  id="input-id"
  value={value}
  onChange={handleChange}
  placeholder="Texte indicatif"
  className="glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-gray-900 px-4 py-3 rounded-xl"
/>

<Textarea
  id="textarea-id"
  value={value}
  onChange={handleChange}
  placeholder="Texte indicatif"
  rows={3}
  className="glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-gray-900 px-4 py-3 rounded-xl resize-none"
/>
```

**Classes obligatoires:**
- `glass` - Arrière-plan glassmorphism (de index.css)
- `border-2 border-white/50` - Bordure épaisse semi-transparente
- `shadow` - Ombre légère
- `focus:ring-4 focus:ring-blue-400/30` - Anneau de focus coloré
- `focus:ring-offset-2` - Décalage de l'anneau
- `transition-all duration-300` - Transition fluide
- `text-gray-900` - Texte foncé lisible
- `px-4 py-3` - Padding confortable
- `rounded-xl` - Coins arrondis

### 5. Select (Menus déroulants avec Glassmorphism)

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger
    id="select-id"
    className="glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 text-gray-900 rounded-xl"
  >
    <SelectValue placeholder="Sélectionnez une option" />
  </SelectTrigger>
  <SelectContent className="bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-lg rounded-xl">
    <SelectItem value="option1" className="text-gray-900 hover:bg-blue-50/80 cursor-pointer">
      Option 1
    </SelectItem>
    <SelectItem value="option2" className="text-gray-900 hover:bg-blue-50/80 cursor-pointer">
      Option 2
    </SelectItem>
  </SelectContent>
</Select>
```

**Règles:**
- SelectTrigger: `glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 text-gray-900 rounded-xl`
- SelectContent: `bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-lg rounded-xl`
- SelectItem: `text-gray-900 hover:bg-blue-50/80 cursor-pointer`

### 6. Boutons - État Actif (Primary) avec Glassmorphism

```tsx
<Button
  onClick={handleClick}
  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
>
  <Icon className="h-4 w-4 mr-2" />
  Action Principale
</Button>
```

**Règles:**
- Gradient: `bg-gradient-to-r from-blue-600 to-indigo-600`
- Hover: `hover:from-blue-700 hover:to-indigo-700`
- Ombre: `shadow-lg hover:shadow-xl`
- Transition: `transition-all duration-300`
- Coins: `rounded-xl`

### 7. Boutons - État Inactif (Outline) avec Glassmorphism

```tsx
<Button
  variant="outline"
  onClick={handleClick}
  className="glass border-2 border-white/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-lg transition-all duration-300 rounded-xl"
>
  <Icon className="h-4 w-4 mr-2" />
  Action Secondaire
</Button>
```

**Règles:**
- Fond: `glass`
- Bordure: `border-2 border-white/50`
- Texte: `text-gray-900`
- Hover: `hover:bg-white/80`
- Ombre: `shadow hover:shadow-lg`
- Transition: `transition-all duration-300`
- Coins: `rounded-xl`

### 8. DialogFooter (Pied de modale)

```tsx
<DialogFooter className="flex gap-3">
  <Button
    variant="outline"
    onClick={handleCancel}
    className="glass border-2 border-white/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-lg transition-all duration-300 rounded-xl"
  >
    Annuler
  </Button>
  <Button
    onClick={handleSubmit}
    disabled={!isValid}
    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50"
  >
    {isSubmitting ? 'Chargement...' : 'Confirmer'}
  </Button>
</DialogFooter>
```

### 9. Cards internes avec Glassmorphism

```tsx
<Card className="glass-card border-2 border-white/30 shadow-lg rounded-2xl">
  <CardHeader>
    <CardTitle className="text-gray-900 gradient-text-3d">Titre</CardTitle>
    <CardDescription className="text-gray-700">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenu */}
  </CardContent>
</Card>
```

### 10. Sections avec Arrière-plans Colorés

```tsx
// Section info bleue
<div className="flex items-center gap-4 p-4 bg-blue-50/70 backdrop-blur-sm rounded-xl border border-blue-100/50">
  {/* Contenu */}
</div>

// Section warning jaune
<div className="flex items-center gap-4 p-3 bg-yellow-50/70 backdrop-blur-sm border border-yellow-200/50 rounded-lg">
  {/* Contenu */}
</div>

// Section danger rouge
<div className="flex items-center gap-4 p-3 bg-red-50/70 backdrop-blur-sm border border-red-200/50 rounded-lg">
  {/* Contenu */}
</div>
```

## Palette de Couleurs Premium

### Textes
- **Principal (titres)**: `text-gray-900` (#111827)
- **Secondaire**: `text-gray-700` (#374151)
- **Tertiaire**: `text-gray-600` (#4B5563)
- **Gradient Premium**: classe `gradient-text-3d`

### Arrière-plans
- **Modal**: `bg-white/95` avec `backdrop-blur-xl`
- **Inputs/Select**: classe `glass` (de index.css)
- **Hover**: `hover:bg-white/80`
- **Sections colorées**: `bg-blue-50/70`, `bg-yellow-50/70`, etc.

### Bordures
- **Principale**: `border-2 border-white/50` ou `border-white/40`
- **Colorées**: `border-blue-200/50`, `border-red-200/50`, etc.

### Ombres
- **Modal**: `shadow-2xl`
- **Cards**: `shadow-lg`
- **Boutons**: `shadow-lg hover:shadow-xl`
- **Inputs**: `shadow`

## Classes CSS Utilitaires (index.css)

### Glassmorphism de base
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-card {
  @apply backdrop-blur-md bg-white/40 border border-white/30 rounded-2xl shadow-lg;
}

.neo-glass {
  @apply backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-lg;
}
```

### Texte avec gradient 3D
```css
.gradient-text-3d {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}
```

### Animation flottante
```css
.floating {
  animation: floating 3s ease-in-out infinite;
}
```

### Effets 3D
```css
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-3d-hover:hover {
  transform: translateY(-4px) rotateX(2deg);
}
```

## Exemples Complets

### Modale Premium avec Glassmorphism

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl rounded-3xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
        <Package className="h-5 w-5 text-blue-600" />
        Titre Premium
      </DialogTitle>
      <DialogDescription className="text-gray-700">
        Description avec <strong className="text-gray-900">emphase</strong>
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-4">
      {/* Section info avec glassmorphism */}
      <div className="flex items-center gap-3 p-4 bg-blue-50/70 backdrop-blur-sm rounded-xl border border-blue-100/50">
        <Info className="h-5 w-5 text-blue-600" />
        <p className="text-gray-700">Information importante</p>
      </div>

      {/* Input glassmorphism */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900 font-medium">
          Nom
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entrez le nom"
          className="glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 focus:ring-offset-2 transition-all duration-300 text-gray-900 px-4 py-3 rounded-xl"
        />
      </div>

      {/* Select glassmorphism */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-gray-900 font-medium">
          Catégorie
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            id="category"
            className="glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 text-gray-900 rounded-xl"
          >
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-lg rounded-xl">
            <SelectItem value="cat1" className="text-gray-900 hover:bg-blue-50/80">
              Catégorie 1
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="glass border-2 border-white/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-lg transition-all duration-300 rounded-xl"
      >
        Annuler
      </Button>
      <Button
        onClick={handleSubmit}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      >
        Confirmer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Modale de Suppression avec Glassmorphism

```tsx
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-2 border-red-200/50 shadow-2xl rounded-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-red-600 flex items-center gap-2 font-bold">
        <Trash2 className="w-5 h-5" />
        Confirmer la suppression
      </AlertDialogTitle>
      <AlertDialogDescription className="text-gray-700">
        Êtes-vous sûr ? Cette action est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="flex items-start gap-2 p-3 bg-red-50/70 backdrop-blur-sm border border-red-200/50 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-red-700">
        <strong className="text-red-800">Attention:</strong> Cette action ne peut pas être annulée.
      </div>
    </div>

    <AlertDialogFooter className="flex gap-3">
      <AlertDialogCancel className="glass border-2 border-white/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-lg transition-all duration-300 rounded-xl">
        Annuler
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      >
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Checklist d'Application Glassmorphism

- [ ] DialogContent: `bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl`
- [ ] Titres: `text-gray-900 font-bold`
- [ ] Labels: `text-gray-900 font-medium` ou `gradient-text-3d`
- [ ] Inputs/Textarea: `glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 text-gray-900 rounded-xl`
- [ ] SelectTrigger: `glass border-2 border-white/50 shadow focus:ring-4 focus:ring-blue-400/30 text-gray-900 rounded-xl`
- [ ] SelectContent: `bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-lg rounded-xl`
- [ ] SelectItem: `text-gray-900 hover:bg-blue-50/80`
- [ ] Boutons actifs: `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl rounded-xl`
- [ ] Boutons inactifs: `glass border-2 border-white/50 text-gray-900 hover:bg-white/80 shadow hover:shadow-lg rounded-xl`
- [ ] Sections colorées: `bg-{color}-50/70 backdrop-blur-sm border border-{color}-200/50`
- [ ] Transitions: `transition-all duration-300`

## Anti-Patterns à Éviter

❌ **Ne PAS faire:**
- Utiliser `bg-white` seul sans transparence
- Oublier `backdrop-blur-xl` sur les modales
- Utiliser des bordures opaques
- Omettre les ombres
- Oublier les transitions
- Texte clair sur fond clair

✅ **Faire:**
- Toujours utiliser `bg-white/95 backdrop-blur-xl`
- Bordures semi-transparentes (`border-white/40`, `border-white/50`)
- Ombres prononcées (`shadow-2xl`, `shadow-lg`)
- Transitions fluides (`transition-all duration-300`)
- Texte foncé lisible (`text-gray-900`)
- Tester la lisibilité sur différents arrière-plans

---

**Version:** 2.0 Glassmorphism
**Date:** 2025-10-11
**Auteur:** Claude Code
**Statut:** Actif
