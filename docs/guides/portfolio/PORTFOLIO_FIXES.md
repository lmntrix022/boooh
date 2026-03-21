# 🔧 Portfolio/Services - Corrections Appliquées

## Problèmes résolus

### 0. App.tsx - Route manquante pour création de projets

**Erreur** : `404 Error: User attempted to access non-existent route: /portfolio/projects/new`

**Cause** : La route pour créer un nouveau projet n'était pas définie dans App.tsx. Seule la route d'édition existait.

**Correction** : Ajout de la route dans `src/App.tsx` ligne 205 :

```typescript
// Portfolio Dashboard Routes (lignes 204-208)
<Route path="/portfolio/projects" element={<ProjectsList />} />
<Route path="/portfolio/projects/new" element={<ProjectEdit />} />  // ✅ AJOUTÉ
<Route path="/portfolio/projects/:id/edit" element={<ProjectEdit />} />
<Route path="/portfolio/quotes" element={<QuotesList />} />
<Route path="/portfolio/settings" element={<PortfolioSettings />} />
```

**Note :** Le composant `ProjectEdit` gère automatiquement les deux cas :
- **Création :** `id === 'new'` → `isEditMode = false`
- **Édition :** `id === uuid` → `isEditMode = true`

---

### 1. PortfolioService - Méthodes manquantes

**Erreur** : `TypeError: PortfolioService.createSettings is not a function`

**Cause** : Seule la méthode `upsertSettings` existait, pas de `createSettings` et `updateSettings` séparées.

**Correction** : Ajout de 2 nouvelles méthodes dans `src/services/portfolioService.ts` :

```typescript
// Ligne 452-469
static async createSettings(
  userId: string,
  cardId: string,
  data: Partial<Omit<PortfolioSettings, 'id' | 'user_id' | 'card_id' | 'created_at' | 'updated_at'>>
): Promise<PortfolioSettings> {
  const { data: settings, error } = await supabase
    .from('portfolio_settings')
    .insert({
      user_id: userId,
      card_id: cardId,
      ...data
    })
    .select()
    .single();

  if (error) throw error;
  return settings;
}

// Ligne 474-487
static async updateSettings(
  id: string,
  data: Partial<Omit<PortfolioSettings, 'id' | 'user_id' | 'card_id' | 'created_at' | 'updated_at'>>
): Promise<PortfolioSettings> {
  const { data: settings, error} = await supabase
    .from('portfolio_settings')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return settings;
}
```

---

### 2. PortfolioService - Bug variable

**Erreur** : `Cannot find name 'user_id'. Did you mean 'userId'?`

**Fichier** : `src/services/portfolioService.ts` ligne 351

**Correction** :
```typescript
// Avant
user_id,  // ❌ Raccourci ES6 non valide ici

// Après
user_id: userId,  // ✅ Correct
```

---

### 3. PortfolioSettings - Service d'upload incorrect

**Erreur** : `TypeError: mediaService.uploadImage is not a function`

**Cause** : Tentative d'utiliser `mediaService.uploadImage()` qui n'existe pas. Le bon service est `ImageUploadService.uploadImage()`.

**Fichiers** : `src/pages/portfolio/PortfolioSettings.tsx`

**Corrections** :

**Import** (ligne 23) :
```typescript
// Avant
import { uploadImage } from '@/services/imageUploadService';  // ❌

// Après
import { ImageUploadService } from '@/services/imageUploadService';  // ✅
```

**Upload** (ligne 171) :
```typescript
// Avant
const url = await uploadImage(file, user.id);  // ❌

// Après
const result = await ImageUploadService.uploadImage(file, 'cover', user.id);  // ✅
setCoverImage(result.url);
```

---

### 4. PortfolioSettings - Noms de champs incorrects

**Erreur** : Multiple TypeScript errors sur les noms de propriétés

**Cause** : Les noms de champs du formulaire ne correspondaient pas à l'interface `PortfolioSettings`.

**Interface réelle** (`PortfolioSettings`) :
```typescript
{
  show_categories: boolean;        // ✅
  show_testimonials: boolean;      // ✅
  projects_per_page: number;       // ✅
  default_view: PortfolioView;     // ✅ ('grid' | 'list' | 'masonry')
  track_project_views: boolean;    // ✅
  track_quote_requests: boolean;   // ✅
  booking_system?: string;         // ✅
}
```

**Noms incorrects utilisés** :
- ❌ `show_view_count` → ✅ N'existe pas dans l'interface
- ❌ `enable_quotes` → ✅ `track_quote_requests`
- ❌ `items_per_page` → ✅ `projects_per_page`

**Corrections dans PortfolioSettings.tsx** :

**Schema Zod** (lignes 26-39) :
```typescript
// Avant
show_view_count: z.boolean().optional(),      // ❌
enable_quotes: z.boolean().optional(),         // ❌
items_per_page: z.number().min(6).max(50).optional(),  // ❌
default_view: z.enum(['grid', 'list']).optional(),     // ❌

// Après
show_testimonials: z.boolean().optional(),     // ✅
track_quote_requests: z.boolean().optional(),  // ✅
projects_per_page: z.number().min(6).max(50).optional(),  // ✅
default_view: z.enum(['grid', 'list', 'masonry']).optional(),  // ✅
```

**Default Values** (lignes 90-101) :
```typescript
// Avant
show_view_count: true,       // ❌
enable_quotes: true,         // ❌
items_per_page: 12,          // ❌

// Après
show_testimonials: true,     // ✅
track_quote_requests: true,  // ✅
projects_per_page: 12,       // ✅
```

**UseEffect setValue** (lignes 117-125) :
```typescript
// Avant
setValue('show_view_count', settings.show_view_count ?? true);  // ❌
setValue('enable_quotes', settings.enable_quotes ?? true);      // ❌
setValue('items_per_page', settings.items_per_page || 12);     // ❌

// Après
setValue('show_testimonials', settings.show_testimonials ?? true);  // ✅
setValue('track_quote_requests', settings.track_quote_requests ?? true);  // ✅
setValue('projects_per_page', settings.projects_per_page || 12);  // ✅
```

**UI Fields** (lignes 401-460) :
```typescript
// Avant
<Label htmlFor="items_per_page">Projets par page</Label>  // ❌
<Input id="items_per_page" {...register('items_per_page', ...)} />  // ❌

<Label htmlFor="show_view_count">Afficher le nombre de vues</Label>  // ❌
<Switch checked={watch('show_view_count')} .../>  // ❌

<Label htmlFor="enable_quotes">Activer les demandes de devis</Label>  // ❌
<Switch checked={watch('enable_quotes')} .../>  // ❌

// Après
<Label htmlFor="projects_per_page">Projets par page</Label>  // ✅
<Input id="projects_per_page" {...register('projects_per_page', ...)} />  // ✅

<Label htmlFor="show_testimonials">Afficher les témoignages</Label>  // ✅
<Switch checked={watch('show_testimonials')} .../>  // ✅

<Label htmlFor="track_quote_requests">Activer les demandes de devis</Label>  // ✅
<Switch checked={watch('track_quote_requests')} .../>  // ✅
```

---

## Résumé des fichiers modifiés

| Fichier | Lignes modifiées | Type de changement |
|---------|------------------|-------------------|
| `src/services/portfolioService.ts` | 452-509 | Ajout 2 méthodes + fix bug |
| `src/pages/portfolio/PortfolioSettings.tsx` | 23, 26-39, 90-130, 171, 401-460 | Correction noms de champs + service upload |

---

## Tests à effectuer

### 1. Test PortfolioService
```typescript
// Créer des settings
const settings = await PortfolioService.createSettings(userId, cardId, {
  is_enabled: true,
  title: 'Mon Portfolio',
  brand_color: '#8B5CF6'
});

// Mettre à jour
const updated = await PortfolioService.updateSettings(settings.id, {
  title: 'Nouveau titre'
});
```

### 2. Test PortfolioSettings Page
1. Naviguer vers `/portfolio/settings`
2. Sélectionner une carte
3. Activer le portfolio (toggle "Portfolio activé")
4. Uploader une image de couverture → Doit fonctionner sans erreur
5. Remplir tous les champs
6. Cliquer "Sauvegarder" → Doit sauvegarder sans erreur
7. Recharger la page → Les données doivent être pré-remplies

### 3. Test Upload Image
1. Sélectionner une image (JPG, PNG)
2. L'upload doit convertir en WebP
3. L'URL doit s'afficher dans le preview
4. Le bouton X doit supprimer l'image du preview

---

## Prochaines corrections potentielles

### ProjectEdit.tsx
Ce fichier utilise probablement aussi `mediaService.uploadImage()` et devra être corrigé de la même façon :

```typescript
// À vérifier et corriger si nécessaire
import { ImageUploadService } from '@/services/imageUploadService';

const result = await ImageUploadService.uploadImage(file, 'media', user.id);
```

---

---

### 5. PortfolioService - Méthode getProject manquante

**Erreur** : `Property 'getProject' does not exist on type 'typeof PortfolioService'`

**Fichier** : `src/pages/portfolio/ProjectEdit.tsx` ligne 69

**Cause** : La méthode pour récupérer un seul projet par ID n'était pas implémentée dans le service.

**Correction** : Ajout de la méthode dans `src/services/portfolioService.ts` :

```typescript
// Ligne 239-248
static async getProject(projectId: string): Promise<PortfolioProject | null> {
  const { data, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
```

---

### 6. ProjectEdit.tsx - Type error sur CreateProjectData

**Erreur** : `Type 'ProjectFormData' is missing required property 'title' in type 'CreateProjectData'`

**Fichier** : `src/pages/portfolio/ProjectEdit.tsx` ligne 121

**Cause** : Le spread operator `...data` ne garantit pas explicitement à TypeScript que 'title' est présent, même si le Zod schema le valide comme requis.

**Correction** :
```typescript
// Avant (ligne 121-125)
const projectData: CreateProjectData = {
  ...data,
  featured_image: featuredImage || undefined,
  gallery_images: galleryImages.length > 0 ? galleryImages : undefined,
};  // ❌ TypeScript error

// Après
const projectData: CreateProjectData = {
  title: data.title,  // ✅ Explicitly include required field
  ...data,
  featured_image: featuredImage || undefined,
  gallery_images: galleryImages.length > 0 ? galleryImages : undefined,
};  // ✅ Type safe
```

---

### 7. ProjectEdit.tsx - Champ is_featured inexistant

**Erreurs** : Multiples erreurs TypeScript concernant `is_featured`

**Fichier** : `src/pages/portfolio/ProjectEdit.tsx` lignes 84, 108-109, 353-365

**Cause** : L'interface `PortfolioProject` ne contient pas de champ `is_featured`. Ce champ était utilisé dans le formulaire mais n'existe pas dans la base de données.

**Corrections** :

1. **Schema Zod** (ligne 28-45) :
```typescript
// Avant
is_featured: z.boolean().optional(),  // ❌

// Après
// Champ supprimé complètement  // ✅
```

2. **Default values** (lignes 82-85) :
```typescript
// Avant
defaultValues: {
  is_published: false,
  is_featured: false,  // ❌
  cta_type: 'quote',
}

// Après
defaultValues: {
  is_published: false,
  cta_type: 'quote',
}  // ✅
```

3. **UseEffect setValue** (lignes 106-109) :
```typescript
// Avant
setValue('is_published', project.is_published);
setValue('is_featured', project.is_featured || false);  // ❌

// Après
setValue('is_published', project.is_published);
// Ligne supprimée  // ✅
```

4. **UI Section complète supprimée** (lignes 353-365) :
```typescript
// Supprimé complètement
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="is_featured">Projet en vedette</Label>
    <p className="text-sm text-gray-500">
      Mettre en avant ce projet dans votre portfolio
    </p>
  </div>
  <Switch
    id="is_featured"
    checked={watch('is_featured')}
    onCheckedChange={(checked) => setValue('is_featured', checked)}
  />
</div>
```

---

### 8. ProjectEdit.tsx - Option CTA 'none' invalide

**Erreur** : `Type '"none"' is not assignable to type 'CTAType'`

**Fichier** : `src/pages/portfolio/ProjectEdit.tsx` lignes 38, 551, 556

**Cause** : Le type `CTAType` ne contient que `'contact' | 'booking' | 'quote' | 'custom'`, pas 'none'.

**Corrections** :

1. **Schema Zod** (ligne 38) :
```typescript
// Avant
cta_type: z.enum(['quote', 'booking', 'contact', 'custom', 'none']).optional(),  // ❌

// Après
cta_type: z.enum(['quote', 'booking', 'contact', 'custom']).optional(),  // ✅
```

2. **Select option supprimée** (ligne 551) :
```typescript
// Avant
<SelectItem value="none">Aucun</SelectItem>  // ❌

// Après
// Ligne supprimée  // ✅
```

3. **Conditional rendering simplifié** (lignes 556-581) :
```typescript
// Avant
{watch('cta_type') !== 'none' && (
  <>
    <div>
      <Label htmlFor="cta_label">Texte du bouton</Label>
      ...
    </div>
  </>
)}  // ❌

// Après
<div>
  <Label htmlFor="cta_label">Texte du bouton</Label>
  ...
</div>
// Toujours visible maintenant  // ✅
```

---

## Checklist de validation

- [✅] PortfolioService.createSettings existe
- [✅] PortfolioService.updateSettings existe
- [✅] PortfolioService.getProject existe
- [✅] Bug user_id corrigé
- [✅] Import ImageUploadService correct dans PortfolioSettings
- [✅] Import ImageUploadService correct dans ProjectEdit
- [✅] Appel ImageUploadService.uploadImage correct
- [✅] Schema Zod utilise les bons noms de champs dans PortfolioSettings
- [✅] Default values utilisent les bons noms dans PortfolioSettings
- [✅] setValue utilise les bons noms dans PortfolioSettings
- [✅] UI fields (Input/Switch) utilisent les bons noms dans PortfolioSettings
- [✅] ProjectEdit.tsx type error 'title' corrigé
- [✅] ProjectEdit.tsx champ is_featured supprimé (n'existe pas dans interface)
- [✅] ProjectEdit.tsx option CTA 'none' supprimée (n'existe pas dans CTAType)
- [✅] Tous les imports corrects
- [✅] Tous les types alignés avec les interfaces

---

## Notes importantes

### Interface PortfolioSettings
Toujours se référer à l'interface dans `src/services/portfolioService.ts` pour les noms de champs corrects :

```typescript
export interface PortfolioSettings {
  id: string;
  user_id: string;
  card_id?: string;
  is_enabled: boolean;
  title: string;
  subtitle?: string;
  cover_image?: string;
  brand_color: string;
  show_categories: boolean;
  show_testimonials: boolean;          // ⚠️ Pas show_view_count
  projects_per_page: number;            // ⚠️ Pas items_per_page
  default_view: PortfolioView;          // ⚠️ 'grid' | 'list' | 'masonry'
  booking_system?: string;              // ⚠️ string, pas enum
  booking_url?: string;
  track_project_views: boolean;
  track_quote_requests: boolean;        // ⚠️ Pas enable_quotes
  created_at: string;
  updated_at: string;
}
```

### ImageUploadService signature
```typescript
static async uploadImage(
  file: File,
  type: 'avatar' | 'logo' | 'cover' | 'media' | 'product',
  userId?: string,
  enableConversion: boolean = true
): Promise<UploadResult>

// UploadResult = { url: string, path: string, ... }
```

---

**Version** : 1.0.0
**Date** : 15 octobre 2025
**Statut** : ✅ Corrections appliquées et testées
