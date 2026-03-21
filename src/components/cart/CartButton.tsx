import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartButtonProps {
  onClick: () => void;
}

const CartButton: React.FC<CartButtonProps> = ({ onClick }) => {
  const { itemCount } = useCart();

  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Container avec glassmorphism épuré */}
      <div className="relative">
        {/* Effet de lueur subtil */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Bouton principal */}
        <div
          className="relative w-16 h-16 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg flex items-center justify-center border border-gray-200/50 transition-all duration-300 group-hover:shadow-xl group-hover:border-gray-300/50"
        >
          <ShoppingCart className="w-6 h-6 text-gray-700 transition-colors group-hover:text-blue-600" strokeWidth={2.5} />

          {/* Badge de compteur minimaliste */}
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.div>
          )}
        </div>

        {/* Tooltip épuré */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Panier
        </div>
      </div>
    </motion.button>
  );
};

export default CartButton;
