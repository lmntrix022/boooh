# Guide de Design des Modales - Booh

## Vue d'ensemble

Ce document définit les standards de design pour toutes les modales (Dialog) de l'application afin d'assurer une lisibilité optimale et une expérience utilisateur cohérente.

## Problèmes résolus

Les modales précédentes souffraient de:
- Arrière-plans transparents rendant le texte illisible
- Boutons avec fond transparent difficiles à distinguer
- Éléments Select avec fond transparent
- Manque de contraste entre le texte et l'arrière-plan

## Standards de Design

### 1. DialogContent (Conteneur Principal)

```tsx
<DialogContent className="max-w-2xl bg-white">
```

**Règles:**
- Toujours utiliser `bg-white` pour un arrière-plan opaque
- Adapter `max-w-*` selon le contenu (md, lg, xl, 2xl, 4xl)
- Ne jamais utiliser de classes glass ou transparentes

### 2. DialogHeader

```tsx
<DialogHeader>
  <DialogTitle className="flex items-center gap-2 text-gray-900">
    <Icon className="h-5 w-5" />
    Titre de la Modale
  </DialogTitle>
  <DialogDescription className="text-gray-600">
    Description avec <strong className="text-gray-900">emphase</strong>
  </DialogDescription>
</DialogHeader>
```

**Règles:**
- Titre: `text-gray-900` pour un texte très lisible
- Description: `text-gray-600` pour différencier du titre
- Emphases (strong): `text-gray-900` pour ressortir

### 3. Labels (Étiquettes)

```tsx
<Label htmlFor="input-id" className="text-gray-900">
  Nom du champ
</Label>
```

**Règles:**
- Toujours utiliser `text-gray-900` pour maximum de lisibilité
- Ajouter `font-semibold` si besoin d'emphase

### 4. Inputs & Textarea

```tsx
<Input
  id="input-id"
  value={value}
  onChange={handleChange}
  placeholder="Texte indicatif"
  className="bg-white text-gray-900 border-gray-300"
/>

<Textarea
  id="textarea-id"
  value={value}
  onChange={handleChange}
  placeholder="Texte indicatif"
  rows={3}
  className="bg-white text-gray-900 border-gray-300"
/>
```

**Règles:**
- `bg-white`: Arrière-plan blanc opaque
- `text-gray-900`: Texte foncé lisible
- `border-gray-300`: Bordure visible mais subtile

### 5. Select (Menus déroulants)

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger id="select-id" className="bg-white text-gray-900 border-gray-300">
    <SelectValue placeholder="Sélectionnez une option" />
  </SelectTrigger>
  <SelectContent className="bg-white border-gray-200">
    <SelectItem value="option1" className="text-gray-900">
      Option 1
    </SelectItem>
    <SelectItem value="option2" className="text-gray-900">
      Option 2
    </SelectItem>
  </SelectContent>
</Select>
```

**Règles:**
- SelectTrigger: `bg-white text-gray-900 border-gray-300`
- SelectContent: `bg-white border-gray-200`
- SelectItem: `text-gray-900` pour chaque option

### 6. Boutons - État Actif (Primary)

```tsx
<Button
  variant="default"
  onClick={handleClick}
  className="bg-blue-600 text-white hover:bg-blue-700"
>
  <Icon className="h-4 w-4 mr-2" />
  Action Principale
</Button>
```

**Règles:**
- Fond: `bg-blue-600` (ou autre couleur principale)
- Texte: `text-white`
- Hover: `hover:bg-blue-700` (version plus foncée)
- État disabled géré automatiquement

### 7. Boutons - État Inactif (Outline)

```tsx
<Button
  variant="outline"
  onClick={handleClick}
  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
>
  <Icon className="h-4 w-4 mr-2" />
  Action Secondaire
</Button>
```

**Règles:**
- Fond: `bg-white`
- Texte: `text-gray-900`
- Bordure: `border-gray-300`
- Hover: `hover:bg-gray-50`

### 8. Boutons - États Conditionnels

```tsx
<Button
  type="button"
  variant={isActive ? 'default' : 'outline'}
  onClick={handleClick}
  className={isActive
    ? 'gap-2 bg-blue-600 text-white hover:bg-blue-700'
    : 'gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
  }
>
  <Icon className="h-4 w-4" />
  Action
</Button>
```

**Règles:**
- Utiliser une ternaire pour basculer entre états actif/inactif
- Maintenir la cohérence des classes entre tous les boutons

### 9. DialogFooter (Pied de modale)

```tsx
<DialogFooter>
  <Button
    variant="outline"
    onClick={handleCancel}
    className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
  >
    Annuler
  </Button>
  <Button
    onClick={handleSubmit}
    disabled={!isValid}
    className="bg-blue-600 text-white hover:bg-blue-700"
  >
    {isSubmitting ? 'Chargement...' : 'Confirmer'}
  </Button>
</DialogFooter>
```

**Règles:**
- Bouton annuler à gauche (outline style)
- Bouton principal à droite (primary style)
- Gérer les états de chargement avec texte dynamique

### 10. Card dans les Modales

```tsx
<Card className="bg-white">
  <CardHeader>
    <CardTitle className="text-gray-900">Titre</CardTitle>
    <CardDescription className="text-gray-600">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenu */}
  </CardContent>
</Card>
```

**Règles:**
- Card: `bg-white`
- Titres: `text-gray-900`
- Descriptions: `text-gray-600`

### 11. Textes de Contexte

```tsx
<p className="text-xs text-gray-500">
  Information complémentaire
</p>

<span className="text-sm text-gray-600">
  Texte normal
</span>

<strong className="text-gray-900">
  Texte important
</strong>
```

**Règles:**
- Texte secondaire: `text-gray-500` ou `text-gray-600`
- Taille: `text-xs` ou `text-sm` selon l'importance
- Emphase: `text-gray-900` avec balise `<strong>`

## Palette de Couleurs

### Textes
- **Principal**: `text-gray-900` (#111827)
- **Secondaire**: `text-gray-600` (#4B5563)
- **Tertiaire**: `text-gray-500` (#6B7280)

### Arrière-plans
- **Principal**: `bg-white` (#FFFFFF)
- **Hover**: `bg-gray-50` (#F9FAFB)
- **Bouton Primary**: `bg-blue-600` (#2563EB)
- **Bouton Primary Hover**: `bg-blue-700` (#1D4ED8)

### Bordures
- **Principale**: `border-gray-300` (#D1D5DB)
- **Select Content**: `border-gray-200` (#E5E7EB)

## Checklist d'Application

Lors de la création ou modification d'une modale, vérifier:

- [ ] DialogContent a `bg-white`
- [ ] Tous les titres utilisent `text-gray-900`
- [ ] Tous les Labels ont `text-gray-900`
- [ ] Tous les Input/Textarea ont: `bg-white text-gray-900 border-gray-300`
- [ ] SelectTrigger a: `bg-white text-gray-900 border-gray-300`
- [ ] SelectContent a: `bg-white border-gray-200`
- [ ] Tous les SelectItem ont `text-gray-900`
- [ ] Boutons actifs: `bg-blue-600 text-white hover:bg-blue-700`
- [ ] Boutons inactifs: `bg-white text-gray-900 border-gray-300 hover:bg-gray-50`
- [ ] DialogFooter a bouton annuler (outline) et confirmer (primary)
- [ ] Tous les textes sont lisibles avec contraste suffisant

## Exemples Complets

### Modale Simple

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-gray-900">
        <Icon className="h-5 w-5" />
        Titre de la Modale
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        Description de l'action à effectuer
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900">
          Nom
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entrez le nom"
          className="bg-white text-gray-900 border-gray-300"
        />
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
      >
        Annuler
      </Button>
      <Button
        onClick={handleSubmit}
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        Confirmer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Modale avec Select

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-lg bg-white">
    <DialogHeader>
      <DialogTitle className="text-gray-900">
        Sélectionner une option
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="category" className="text-gray-900">
          Catégorie
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category" className="bg-white text-gray-900 border-gray-300">
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="cat1" className="text-gray-900">
              Catégorie 1
            </SelectItem>
            <SelectItem value="cat2" className="text-gray-900">
              Catégorie 2
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
      >
        Annuler
      </Button>
      <Button
        onClick={handleSubmit}
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        Valider
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Anti-Patterns à Éviter

❌ **Ne PAS faire:**
- Utiliser `glass` ou `backdrop-blur` dans DialogContent
- Omettre `bg-white` sur les inputs
- Utiliser des couleurs de texte claires (gray-300, gray-400) sur fond blanc
- Oublier les classes sur SelectContent et SelectItem
- Mélanger des styles de boutons inconsistants

✅ **Faire:**
- Toujours utiliser `bg-white` pour les fonds
- Utiliser `text-gray-900` pour tous les textes principaux
- Appliquer systématiquement les classes sur tous les éléments
- Tester la lisibilité sur différents écrans
- Maintenir la cohérence entre toutes les modales

## Maintenance

Ce guide doit être mis à jour lorsque:
- De nouveaux composants de modale sont ajoutés
- Des patterns d'utilisation émergent
- Des problèmes de lisibilité sont identifiés
- La palette de couleurs est modifiée

---

**Version:** 1.0
**Date:** 2025-10-11
**Auteur:** Claude Code
**Statut:** Actif
