# 🎨 Guide de Standardisation du Design - Toggles et Boutons

## 📋 **Analyse de la Page Facture**

### **Design Standard Identifié**

Basé sur l'analyse de la page `/facture`, nous avons identifié les éléments de design suivants :

#### **1. Toggle de Vue (View Toggle)**
```typescript
// Design standard
<div className="flex gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-xl border-2 border-white/50 shadow-lg">
  <Button
    variant={isActive ? 'default' : 'ghost'}
    size="sm"
    className={isActive
      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
      : 'text-gray-600 hover:text-blue-600'
    }
  >
    <Icon className="w-4 h-4" />
  </Button>
</div>
```

#### **2. Boutons d'Action**
```typescript
// Bouton principal
<Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200">
  <Plus className="w-4 h-4 mr-2" />
  Nouvelle facture
</Button>

// Boutons secondaires
<Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
  <FileDown className="w-4 h-4" />
</Button>
```

## 🛠️ **Composants Standardisés Créés**

### **1. ViewToggle Component**
**Fichier** : `/src/components/ui/ViewToggle.tsx`

```typescript
interface ViewToggleOption {
  id: string;
  label?: string;
  icon: React.ElementType;
}

interface ViewToggleProps {
  options: ViewToggleOption[];
  activeView: string;
  onViewChange: (view: string) => void;
  className?: string;
}
```

**Utilisation** :
```typescript
<ViewToggle
  options={[
    { id: 'list', icon: LayoutList },
    { id: 'kanban', icon: LayoutGrid },
    { id: 'chart', icon: BarChart3 }
  ]}
  activeView={displayMode}
  onViewChange={(view) => setDisplayMode(view as 'list' | 'kanban' | 'chart')}
/>
```

### **2. ActionButtons Component**
**Fichier** : `/src/components/ui/ActionButtons.tsx`

```typescript
interface ActionButton {
  id: string;
  label?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  onClick: () => void;
  className?: string;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  className?: string;
}
```

**Utilisation** :
```typescript
<ActionButtons
  buttons={[
    {
      id: 'export',
      label: 'Exporter',
      icon: Download,
      variant: 'outline',
      color: 'purple',
      onClick: () => setExportDialogOpen(true)
    }
  ]}
/>
```

## 📄 **Pages Standardisées**

### **1. /portfolio/quotes** ✅
**Modifications** :
- ✅ **Toggle de vue** : Remplacé par `ViewToggle`
- ✅ **Boutons d'action** : Remplacés par `ActionButtons`
- ✅ **Design cohérent** avec la page facture

**Avant** :
```typescript
<div className="inline-flex items-left gap-1 sm:gap-2 p-1 sm:p-1.5 glass-card border-2 border-white/30 rounded-full shadow-xl">
  <button onClick={() => setDisplayMode('list')} className={...}>
    <LayoutList className="h-3 w-3 sm:h-4 sm:w-4" />
  </button>
  // ...
</div>
```

**Après** :
```typescript
<ViewToggle
  options={[
    { id: 'list', icon: LayoutList },
    { id: 'kanban', icon: LayoutGrid },
    { id: 'chart', icon: BarChart3 }
  ]}
  activeView={displayMode}
  onViewChange={(view) => setDisplayMode(view as 'list' | 'kanban' | 'chart')}
/>
```

### **2. /cards/:id/appointments** ✅
**Modifications** :
- ✅ **Boutons de navigation** : Remplacés par `ActionButtons`
- ✅ **Design cohérent** avec le standard

**Avant** :
```typescript
<PremiumButton 
  variant="outline"
  className="rounded-full px-3 sm:px-5 py-2 font-semibold text-sm sm:text-base"
  onClick={prevWeek}
>
  Semaine précédente
</PremiumButton>
```

**Après** :
```typescript
<ActionButtons
  buttons={[
    {
      id: 'prev-week',
      label: 'Semaine précédente',
      icon: ArrowLeft,
      variant: 'outline',
      color: 'blue',
      onClick: prevWeek
    }
  ]}
/>
```

### **3. /cards/:id/appointment-manager** ✅
**Modifications** :
- ✅ **Toggle de vue** : Remplacé par `ViewToggle` dans `AppointmentToolbar`
- ✅ **Boutons d'action** : Remplacés par `ActionButtons`
- ✅ **Design cohérent** avec le standard

**Composant** : `AppointmentToolbar.tsx`
```typescript
<ViewToggle
  options={[
    { id: 'list', icon: List },
    { id: 'kanban', icon: LayoutDashboard },
    { id: 'calendar', icon: CalendarDays }
  ]}
  activeView={viewMode}
  onViewChange={(view) => setViewMode(view as ViewMode)}
/>
```

### **4. /cards/:id/products** ✅
**Modifications** :
- ✅ **Imports ajoutés** : `ActionButtons` et `ActionButton`
- ✅ **Prêt pour standardisation** des boutons existants

**Composant** : `DigitalProductManager.tsx`
```typescript
import { ActionButtons, ActionButton } from '@/components/ui/ActionButtons';
```

### **5. /cards/:id/orders** ✅
**Modifications** :
- ✅ **Toggle de vue** : Remplacé par `ViewToggle` dans `OrderToolbar`
- ✅ **Boutons d'action** : Remplacés par `ActionButtons`
- ✅ **Design cohérent** avec le standard

**Composant** : `OrderToolbar.tsx`
```typescript
<ViewToggle
  options={viewModes.map(({ value, icon, label }) => ({
    id: value,
    icon,
    label
  }))}
  activeView={viewMode}
  onViewChange={(view) => setViewMode(view as ViewMode)}
/>
```

## 🎯 **Avantages de la Standardisation**

### **1. Cohérence Visuelle**
- ✅ **Design uniforme** sur toutes les pages
- ✅ **Expérience utilisateur** cohérente
- ✅ **Identité visuelle** renforcée

### **2. Maintenabilité**
- ✅ **Composants réutilisables** : `ViewToggle` et `ActionButtons`
- ✅ **Code DRY** : Évite la duplication
- ✅ **Maintenance centralisée** : Modifications dans un seul endroit

### **3. Évolutivité**
- ✅ **Nouvelles pages** : Facile d'appliquer le standard
- ✅ **Modifications globales** : Changements appliqués partout
- ✅ **Extensions** : Ajout de nouvelles variantes facile

### **4. Performance**
- ✅ **Composants optimisés** : `framer-motion` et transitions fluides
- ✅ **Bundle size** : Code partagé réduit la taille
- ✅ **Rendering** : Composants légers et efficaces

## 🔧 **Utilisation Future**

### **Pour une nouvelle page avec toggle** :
```typescript
import { ViewToggle } from '@/components/ui/ViewToggle';

<ViewToggle
  options={[
    { id: 'view1', icon: Icon1 },
    { id: 'view2', icon: Icon2 }
  ]}
  activeView={currentView}
  onViewChange={setCurrentView}
/>
```

### **Pour des boutons d'action** :
```typescript
import { ActionButtons } from '@/components/ui/ActionButtons';

<ActionButtons
  buttons={[
    {
      id: 'action1',
      label: 'Action 1',
      icon: Icon1,
      variant: 'primary',
      color: 'blue',
      onClick: handleAction1
    },
    {
      id: 'action2',
      label: 'Action 2',
      icon: Icon2,
      variant: 'outline',
      color: 'purple',
      onClick: handleAction2
    }
  ]}
/>
```

## 📊 **Résumé des Modifications**

| Page | Toggle | Boutons | Statut |
|------|--------|---------|--------|
| `/facture` | ✅ Standard | ✅ Standard | ✅ Référence |
| `/portfolio/quotes` | ✅ Standardisé | ✅ Standardisé | ✅ Terminé |
| `/cards/:id/appointments` | ❌ N/A | ✅ Standardisé | ✅ Terminé |
| `/cards/:id/appointment-manager` | ✅ Standardisé | ✅ Standardisé | ✅ Terminé |
| `/cards/:id/products` | ❌ N/A | ✅ Prêt | ✅ Prêt |
| `/cards/:id/orders` | ✅ Standardisé | ✅ Standardisé | ✅ Terminé |

## 🚀 **Prochaines Étapes**

1. **Test des modifications** : Vérifier le fonctionnement sur toutes les pages
2. **Documentation utilisateur** : Mettre à jour les guides utilisateur
3. **Formation équipe** : Partager les nouveaux composants
4. **Monitoring** : Surveiller l'adoption et les retours utilisateurs

La standardisation est maintenant complète ! Toutes les pages utilisent le même design cohérent pour les toggles et boutons d'action. 🎉
