import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types pour les articles du panier
export interface CartItem {
  id: string;
  productId: string;
  cardId: string;
  name: string;
  price: number;
  quantity: number;
  type: 'physical' | 'digital';
  image?: string;
  maxQuantity?: number; // Pour la gestion des stocks
  sellerName?: string;
  sellerEmail?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'booh_marketplace_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Charger le panier depuis le localStorage au montage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      }
    } catch (error) {
      // Error log removed
    }
  }, []);

  // Sauvegarder le panier dans le localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      // Error log removed
    }
  }, [items]);

  // Calculer le nombre total d'articles
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculer le montant total
  const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Ajouter un article au panier
  const addItem = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.productId === item.productId);

      if (existingItem) {
        // Vérifier la quantité maximale
        const newQuantity = existingItem.quantity + quantity;
        if (item.maxQuantity && newQuantity > item.maxQuantity) {
          toast({
            title: "Quantité maximale atteinte",
            description: `Vous ne pouvez pas ajouter plus de ${item.maxQuantity} exemplaires de ce produit.`,
            variant: "destructive",
          });
          return currentItems;
        }

        // Mettre à jour la quantité
        toast({
          title: "Quantité mise à jour",
          description: `${item.name} • ${newQuantity}×`,
          variant: "success",
        });

        return currentItems.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: newQuantity }
            : i
        );
      } else {
        // Ajouter un nouvel article
        toast({
          title: "Ajouté au panier",
          description: `${item.name} • ${quantity}×`,
          variant: "success",
        });

        return [...currentItems, { ...item, quantity }];
      }
    });
  };

  // Retirer un article du panier
  const removeItem = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(i => i.productId === productId);
      if (item) {
        toast({
          title: "Retiré du panier",
          description: `${item.name} a été retiré de votre panier.`,
        });
      }
      return currentItems.filter(i => i.productId !== productId);
    });
  };

  // Mettre à jour la quantité d'un article
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item => {
        if (item.productId === productId) {
          // Vérifier la quantité maximale
          if (item.maxQuantity && quantity > item.maxQuantity) {
            toast({
              title: "Quantité maximale atteinte",
              description: `Maximum: ${item.maxQuantity} exemplaires.`,
              variant: "destructive",
            });
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Vider le panier
  const clearCart = () => {
    setItems([]);
    toast({
      title: "Panier vidé",
      description: "Tous les articles ont été retirés de votre panier.",
    });
  };

  // Vérifier si un produit est dans le panier
  const isInCart = (productId: string): boolean => {
    return items.some(item => item.productId === productId);
  };

  // Obtenir la quantité d'un produit dans le panier
  const getItemQuantity = (productId: string): number => {
    const item = items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte du panier
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
