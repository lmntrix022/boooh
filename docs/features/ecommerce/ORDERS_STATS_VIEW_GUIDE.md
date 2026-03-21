# 📊 Vue Statistiques - Page Commandes

## 🎯 **Objectif**

Ajout d'une vue statistique complète à la page `/cards/:id/orders` pour fournir des insights détaillés sur les commandes et les performances commerciales.

## 🎨 **Design Cohérent**

### **Respect du Design System**
- ✅ **Glassmorphism** : Utilisation des classes `glass-card` et `border-2 border-white/30`
- ✅ **Animations** : `framer-motion` avec délais échelonnés pour un effet fluide
- ✅ **Couleurs** : Palette cohérente avec le reste de l'application
- ✅ **Typographie** : Même hiérarchie de titres et textes
- ✅ **Espacement** : Grilles et gaps cohérents

### **Éléments Visuels**
```typescript
// Cartes avec glassmorphism
<Card className="glass-card border-2 border-white/30 shadow-xl">

// Animations échelonnées
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
```

## 📊 **Composant OrderStatsView**

### **Fonctionnalités Principales**

#### **1. Métriques Clés**
- **Commandes totales** : Nombre total de commandes
- **Chiffre d'affaires** : Revenus totaux des commandes payées
- **Panier moyen** : Valeur moyenne par commande
- **Taux de conversion** : Pourcentage de commandes payées

#### **2. Graphiques Interactifs**

**Évolution Mensuelle (Line Chart)**
```typescript
<LineChart data={stats.monthlyStats}>
  <Line 
    type="monotone" 
    dataKey="orders" 
    stroke="#3b82f6" 
    strokeWidth={3}
    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
  />
</LineChart>
```

**Statut des Paiements (Pie Chart)**
```typescript
<PieChart>
  <Pie
    data={paymentStatusData}
    label={({ status, count }) => `${status}: ${count}`}
    dataKey="count"
  >
    {paymentStatusData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
</PieChart>
```

**Statut d'Expédition (Bar Chart)**
```typescript
<BarChart data={shippingStatusData} layout="horizontal">
  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
    {shippingStatusData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Bar>
</BarChart>
```

#### **3. Top Produits**
- Liste des 5 produits les plus vendus
- Affichage du nombre de commandes et du chiffre d'affaires
- Design avec badges numérotés

## 🔧 **Modifications Techniques**

### **1. Types Mis à Jour**
```typescript
// Avant
export type ViewMode = "list" | "kanban" | "invoice";

// Après
export type ViewMode = "list" | "kanban" | "stats";
```

### **2. OrderToolbar Modifié**
```typescript
const viewModes = [
  { value: "list" as ViewMode, icon: List, label: "Liste" },
  { value: "kanban" as ViewMode, icon: LayoutGrid, label: "Kanban" },
  { value: "stats" as ViewMode, icon: BarChart3, label: "Statistiques" },
];
```

### **3. Intégration dans Orders.tsx**
```typescript
{/* Vue Statistiques */}
{viewMode === "stats" && (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.5 }}
  >
    <OrderStatsView 
      orders={filteredOrders} 
      cardName={cardName || "Ma carte"}
    />
  </motion.div>
)}
```

## 📈 **Données Calculées**

### **Statistiques Principales**
```typescript
const stats = useMemo(() => {
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(order => order.payment_status === 'paid')
    .reduce((sum, order) => sum + (order.products?.price || 0) * (order.quantity || 1), 0);
  
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // ... autres calculs
}, [orders]);
```

### **Données Temporelles**
- **6 derniers mois** : Évolution des commandes et revenus
- **Formatage français** : Dates et devises en français
- **Agrégation mensuelle** : Calculs automatiques par mois

### **Analyses par Statut**
- **Paiements** : Payées, En attente, Annulées, Remboursées
- **Expédition** : Livrées, Expédiées, En traitement, En attente
- **Couleurs cohérentes** : Palette définie pour chaque statut

## 🎨 **Palette de Couleurs**

```typescript
const COLORS = {
  pending: '#f59e0b',    // Orange
  paid: '#10b981',       // Vert
  cancelled: '#ef4444',  // Rouge
  refunded: '#6b7280',   // Gris
  processing: '#3b82f6', // Bleu
  shipped: '#8b5cf6',    // Violet
  delivered: '#10b981'   // Vert
};
```

## 📱 **Responsive Design**

### **Grilles Adaptatives**
```typescript
// Métriques principales
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Graphiques
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Top produits et expédition
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

### **Responsive Charts**
- **Recharts ResponsiveContainer** : Adaptation automatique
- **Tooltips adaptatifs** : Informations contextuelles
- **Légendes optimisées** : Lisibles sur tous les écrans

## 🚀 **Avantages**

### **1. Insights Commerciaux**
- ✅ **Performance** : Vue d'ensemble des ventes
- ✅ **Tendances** : Évolution dans le temps
- ✅ **Produits** : Identification des best-sellers
- ✅ **Conversion** : Taux de transformation

### **2. Expérience Utilisateur**
- ✅ **Navigation fluide** : Intégration seamless avec les autres vues
- ✅ **Design cohérent** : Même esthétique que le reste de l'app
- ✅ **Interactivité** : Graphiques cliquables et informatifs
- ✅ **Performance** : Calculs optimisés avec `useMemo`

### **3. Maintenance**
- ✅ **Code modulaire** : Composant indépendant
- ✅ **Types stricts** : TypeScript pour la sécurité
- ✅ **Réutilisabilité** : Peut être adapté pour d'autres pages
- ✅ **Extensibilité** : Facile d'ajouter de nouvelles métriques

## 🔄 **Utilisation**

### **Navigation**
1. Aller sur `/cards/:id/orders`
2. Cliquer sur l'icône de graphique (troisième bouton du toggle)
3. Explorer les différentes sections statistiques

### **Fonctionnalités**
- **Métriques en temps réel** : Basées sur les commandes filtrées
- **Graphiques interactifs** : Hover pour plus de détails
- **Export possible** : Données disponibles pour export
- **Filtres appliqués** : Les filtres de la toolbar affectent les stats

## 📋 **Fichiers Modifiés**

| Fichier | Modifications |
|---------|---------------|
| `src/pages/Orders.tsx` | Type ViewMode, import OrderStatsView, vue conditionnelle |
| `src/components/orders/OrderToolbar.tsx` | Icône BarChart3, label "Statistiques" |
| `src/components/orders/OrderStatsView.tsx` | **Nouveau composant** complet |

## 🎉 **Résultat**

La page `/cards/:id/orders` dispose maintenant d'une vue statistique complète et cohérente avec le design de l'application, offrant des insights précieux sur les performances commerciales ! 📊✨
