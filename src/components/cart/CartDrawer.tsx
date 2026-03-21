import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Download,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// PREMIUM CART DRAWER - AWWWARDS/APPLE LEVEL
// ═══════════════════════════════════════════════════════════

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount, removeItem, updateQuantity, clearCart } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;

    // Grouper les articles par vendeur (cardId)
    const itemsByCard = items.reduce((acc, item) => {
      if (!acc[item.cardId]) {
        acc[item.cardId] = [];
      }
      acc[item.cardId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Naviguer vers la page de checkout avec les données
    navigate('/checkout', { state: { cartItems: items, itemsByCard } });
    onClose();
  };

  return (
    <>
      {/* Overlay premium avec blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Drawer Premium - AWWWARDS/APPLE LEVEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[430px] z-50 flex flex-col"
          >
            {/* Background avec effet de profondeur */}
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />
            
            {/* Contenu */}
            <div className="relative z-10 flex flex-col h-full">
              
              {/* Header Premium */}
              <div className="relative border-b border-gray-100">
                {/* Subtle gradient top */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {/* Icône premium */}
                      <motion.div 
                        className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2} />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Panier</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                          {itemCount} article{itemCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Bouton fermer premium */}
                    <motion.button
                      onClick={onClose}
                      className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
                    </motion.button>
                  </div>

                  {/* Total premium avec gradient subtil */}
                  <motion.div 
                    className="relative overflow-hidden rounded-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {/* Background avec effet de profondeur */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100/50" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.03]" />
                    
                    <div className="relative p-4 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 tracking-tight">
                          {totalAmount.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">FCFA</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

            {/* Content Premium avec scroll */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-5 md:p-6">
                {items.length === 0 ? (
                  /* État vide premium */
                  <motion.div 
                    className="flex flex-col items-center justify-center h-[50vh] text-center px-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Icône avec pulse rings */}
                    <div className="relative mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-3xl bg-gray-200"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-3xl bg-gray-200"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      <div className="relative w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center">
                        <ShoppingCart className="w-9 h-9 text-gray-400" strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                      Panier vide
                    </h3>
                    <p className="text-gray-500 mb-8 text-[15px] leading-relaxed max-w-xs">
                      Découvrez nos produits et ajoutez-les à votre panier
                    </p>
                    <Button
                      onClick={onClose}
                      className="bg-gray-900 hover:bg-black text-white h-12 px-8 rounded-full font-semibold text-[15px] transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Découvrir
                    </Button>
                  </motion.div>
                ) : (
                  /* Liste des articles */
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                      >
                        {/* Ombre de carte */}
                        <div className="absolute -inset-px rounded-2xl bg-black/[0.02] translate-y-1" />
                        
                        {/* Card de l'article */}
                        <div className="relative bg-white rounded-2xl p-4 ring-1 ring-black/[0.04] hover:ring-black/[0.06] transition-all duration-300">
                          {/* Inner glow */}
                          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60 pointer-events-none" />
                          
                          <div className="flex gap-4">
                            {/* Image du produit - Premium avec effet hover */}
                            <motion.div 
                              className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/[0.04]"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              {item.image ? (
                                <>
                                  <CardImageOptimizer
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    type="product"
                                  />
                                  {/* Overlay hover */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                  {item.type === 'physical' ? (
                                    <Package className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                                  ) : (
                                    <Download className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                                  )}
                                </div>
                              )}
                              
                              {/* Badge type */}
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center shadow-sm">
                                {item.type === 'physical' ? (
                                  <Package className="w-3 h-3 text-gray-600" strokeWidth={2} />
                                ) : (
                                  <Download className="w-3 h-3 text-gray-600" strokeWidth={2} />
                                )}
                              </div>
                            </motion.div>

                            {/* Info produit */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[15px] text-gray-900 mb-1 truncate leading-tight">
                                {item.name}
                              </h3>
                              <p className="text-lg font-bold text-gray-900 mb-3 tracking-tight">
                                {item.price.toLocaleString()} <span className="text-sm text-gray-500">FCFA</span>
                              </p>

                              {/* Contrôles de quantité Premium */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center bg-gray-50 rounded-xl p-1">
                                  <motion.button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors shadow-sm ring-1 ring-black/[0.04]"
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Minus className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.5} />
                                  </motion.button>
                                  <span className="w-10 text-center font-bold text-sm text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <motion.button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors shadow-sm ring-1 ring-black/[0.04] disabled:opacity-50"
                                    disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Plus className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.5} />
                                  </motion.button>
                                </div>

                                {/* Bouton supprimer premium */}
                                <motion.button
                                  onClick={() => removeItem(item.productId)}
                                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" strokeWidth={2} />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Bouton vider le panier - Premium */}
                    {items.length > 0 && (
                      <motion.button
                        onClick={clearCart}
                        className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                        Vider le panier
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Premium - Gradient fade + CTA */}
            {items.length > 0 && (
              <div className="relative">
                {/* Gradient fade au-dessus */}
                <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                
                {/* Border top subtile */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                
                <div className="bg-white p-5 md:p-6">
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* Résumé premium */}
                    <div className="space-y-3 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Sous-total</span>
                        <span className="text-base font-semibold text-gray-900">
                          {totalAmount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Livraison</span>
                        <span className="text-sm font-medium text-gray-500">Au checkout</span>
                      </div>
                    </div>

                    {/* Bouton Commander Premium */}
                    <motion.button
                      onClick={handleCheckout}
                      className="relative w-full h-14 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl overflow-hidden group transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      
                      <span className="relative flex items-center justify-center gap-2 text-[15px] tracking-wide">
                        Commander
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                      </span>
                    </motion.button>

                    {/* Actions secondaires */}
                    <div className="flex gap-2 pt-2">
                      <motion.button
                        onClick={() => {
                          navigate('/my-purchases');
                          onClose();
                        }}
                        className="flex-1 text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-gray-50 font-medium"
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-4 h-4" strokeWidth={2} />
                        Mes achats
                      </motion.button>
                      <motion.button
                        onClick={onClose}
                        className="flex-1 text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors py-2.5 rounded-xl hover:bg-gray-50 font-medium"
                        whileTap={{ scale: 0.98 }}
                      >
                        Continuer
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
                
                {/* Safe area pour mobile */}
                <div className="h-[env(safe-area-inset-bottom,16px)] bg-white" />
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
