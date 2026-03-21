# Guide du Système de Panier - Marketplace Bööh

## 📋 Vue d'ensemble

Le système de panier permet aux clients d'ajouter plusieurs produits (physiques et numériques) à leur panier, de gérer les quantités, et de passer une commande groupée.

## 🗂️ Structure du Système

### 1. Contexte du Panier (`src/contexts/CartContext.tsx`)

Le contexte global qui gère l'état du panier :

```typescript
interface CartItem {
  id: string;
  productId: string;
  cardId: string;
  name: string;
  price: number;
  quantity: number;
  type: 'physical' | 'digital';
  image?: string;
  maxQuantity?: number;
  sellerName?: string;
  sellerEmail?: string;
}
```

**Fonctions disponibles** :
- `addItem(item, quantity)` - Ajoute un produit au panier
- `removeItem(productId)` - Retire un produit
- `updateQuantity(productId, quantity)` - Modifie la quantité
- `clearCart()` - Vide le panier
- `isInCart(productId)` - Vérifie si un produit est dans le panier
- `getItemQuantity(productId)` - Obtient la quantité d'un produit

**Propriétés** :
- `items` - Liste des articles
- `itemCount` - Nombre total d'articles
- `totalAmount` - Montant total

### 2. Composants UI

#### CartButton (`src/components/cart/CartButton.tsx`)
- Bouton flottant en bas à droite
- Badge avec le nombre d'articles
- Animations et tooltip

#### CartDrawer (`src/components/cart/CartDrawer.tsx`)
- Interface complète du panier
- Gestion des quantités
- Résumé des totaux
- Navigation vers le checkout

### 3. Intégration dans les Pages

#### ProductDetail (`src/pages/ProductDetail.tsx`)
```tsx
import { useCart } from '@/contexts/CartContext';

const { addItem, isInCart, getItemQuantity } = useCart();

// Ajouter au panier
const handleAddToCart = () => {
  addItem({
    id: `${cardId}-${productId}`,
    productId: productId!,
    cardId: cardId!,
    name: product.name,
    price: product.price,
    type: product.type,
    image: product.image,
  }, quantity);
};
```

#### MarketplaceGrid (`src/components/marketplace/MarketplaceGrid.tsx`)
- Bouton "Ajouter" sur chaque carte produit
- Badge de quantité si déjà dans le panier

### 4. Page de Checkout (`src/pages/Checkout.tsx`)

**Formulaire de commande** :
- Informations personnelles (prénom, nom, email, téléphone)
- Adresse de livraison (adresse, ville, code postal)
- Instructions de livraison (optionnel)

**Processus de commande** :
1. Validation du formulaire
2. Création d'une commande pour chaque produit
3. Enregistrement dans `product_inquiries`
4. Affichage de la page de succès
5. Vidage automatique du panier

## 🗄️ Base de Données

### Table `product_inquiries`

```sql
{
  id: uuid,
  product_id: uuid,
  card_id: uuid,
  client_name: string,
  client_email: string,
  client_phone: string,
  notes: string,
  quantity: number,
  status: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Colonnes importantes** :
- `client_name` : Nom complet du client
- `client_email` : Email du client
- `client_phone` : Téléphone du client
- `notes` : Notes et adresse de livraison
- `quantity` : Quantité commandée
- `status` : Statut de la commande (pending, confirmed, delivered, etc.)

## 🔄 Flux de Commande

### Méthode 1 : Achat Direct
```
Marketplace → ProductDetail → "Acheter maintenant" → Modal → Commande
```

### Méthode 2 : Via le Panier
```
Marketplace → "Ajouter au panier" → CartDrawer → Checkout → Commandes
```

## 💾 Persistance des Données

Le panier est sauvegardé dans le `localStorage` :
- Clé : `booh_marketplace_cart`
- Format : JSON array de CartItem
- Persistance : Survit aux rechargements de page

## 🎨 Design & UX

### Couleurs
- Bouton principal : Gradient bleu → violet → rose
- Succès : Vert (commandes)
- Information : Bleu (panier)

### Animations
- Framer Motion pour les transitions
- Hover effects sur les boutons
- Drawer qui glisse depuis la droite

## 🔧 Configuration

### Installation
Le système est déjà intégré dans `App.tsx` :

```tsx
<BrowserRouter>
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        {/* Votre application */}
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
</BrowserRouter>
```

### Route Checkout
```tsx
<Route path="/checkout" element={<Checkout />} />
```

## 📝 Utilisation

### Dans un composant

```tsx
import { useCart } from '@/contexts/CartContext';
import CartButton from '@/components/cart/CartButton';
import CartDrawer from '@/components/cart/CartDrawer';

function MyComponent() {
  const { addItem, items, totalAmount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      {/* Votre contenu */}
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
```

## 🚀 Points Forts

1. **Multi-vendeurs** : Gère les produits de différents vendeurs
2. **Persistance** : Le panier reste même après fermeture du navigateur
3. **Validation** : Contrôle des stocks et des quantités
4. **UX fluide** : Notifications et animations
5. **Responsive** : Fonctionne sur tous les appareils

## 🔍 Débogage

### Problèmes courants

**Le panier ne se sauvegarde pas** :
- Vérifier que le localStorage est activé
- Vérifier la console pour les erreurs

**Les commandes ne s'enregistrent pas** :
- Vérifier les politiques RLS de Supabase
- Vérifier que la table `product_inquiries` existe
- Vérifier les colonnes (client_name, client_email, etc.)

**Le CartProvider ne fonctionne pas** :
- Vérifier qu'il est bien dans la hiérarchie des providers
- Vérifier l'import : `import { CartProvider } from '@/contexts/CartContext'`

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Vérifier les erreurs Supabase
3. Consulter ce guide

---

**Version** : 1.0.0
**Date** : Janvier 2025
**Développé pour** : Bööh Marketplace
