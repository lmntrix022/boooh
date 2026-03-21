import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Package, Download, Briefcase } from 'lucide-react';

// Types pour les produits
interface PhysicalProduct {
  id: string;
  name: string;
  price: string;
  image?: string;
  description?: string;
}

interface DigitalProduct {
  id: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  currency: string;
  is_free: boolean;
  thumbnail_url?: string;
  file_url?: string;
  preview_url?: string;
}

interface PortfolioSettings {
  is_enabled: boolean;
  title?: string;
  brand_color?: string;
}

interface ProductDisplaySectionProps {
  products: PhysicalProduct[];
  digitalProducts: DigitalProduct[];
  onProductClick?: (product: PhysicalProduct | DigitalProduct) => void;
  onSwitchToBoutique?: () => void;
  cardId?: string;
  portfolioSettings?: PortfolioSettings | null;
  portfolioProjectsCount?: number;
}

// Composant principal simplifié - Bouton CTA unique
const ProductDisplaySection: React.FC<ProductDisplaySectionProps> = memo(({
  products,
  digitalProducts,
  cardId,
  portfolioSettings = null,
  portfolioProjectsCount = 0,
}) => {
  const navigate = useNavigate();

  const hasProducts = products.length > 0;
  const hasDigitalProducts = digitalProducts.length > 0;
  const hasAnyProducts = hasProducts || hasDigitalProducts;
  const hasPortfolio = portfolioSettings?.is_enabled && portfolioProjectsCount > 0;
  const totalProducts = products.length + digitalProducts.length;


  // Si pas de produits ni de portfolio, ne rien afficher
  if (!hasAnyProducts && !hasPortfolio) {
    return null;
  }

  const handleNavigateToMarketplace = () => {
    if (cardId) {
      navigate(`/card/${cardId}/marketplace`);
    }
  };

  const handleNavigateToPortfolio = () => {
    if (cardId) {
      navigate(`/card/${cardId}/portfolio`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Version Premium - Épurée et Luxueuse */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-white/75 via-white/70 to-gray-50/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] transition-all duration-500">
        {/* Effet de brillance subtil au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-blue-50/30 group-hover:via-purple-50/20 group-hover:to-pink-50/30 transition-all duration-700" />

        {/* Ligne de lumière en haut */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

        <div className="relative p-6">
          {/* En-tête Premium */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Icône avec effet glassmorphism */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 text-base tracking-tight">
                  {hasPortfolio ? 'Produits & Services' : 'Boutique'}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {hasAnyProducts ? `${totalProducts} ${totalProducts > 1 ? 'articles' : 'article'}` : 'Services disponibles'}
                </p>
              </div>
            </div>

            {/* Badge premium discret */}
            <div className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
              <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                PREMIUM
              </span>
            </div>
          </div>

          {/* Stats élégantes et compactes */}
          {(hasProducts || hasDigitalProducts) && (
            <div className="flex gap-2 mb-5">
              {hasProducts && (
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-blue-50/80 to-blue-50/40 rounded-xl border border-blue-100/50 backdrop-blur-sm">
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{products.length}</p>
                  </div>
                </div>
              )}

              {hasDigitalProducts && (
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-br from-purple-50/80 to-purple-50/40 rounded-xl border border-purple-100/50 backdrop-blur-sm">
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Download className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{digitalProducts.length}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons CTA */}
          <div className="space-y-3">
            {/* Bouton Boutique (seulement si produits existent) */}
            {hasAnyProducts && (
              <motion.button
                onClick={handleNavigateToMarketplace}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 rounded-xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-300"
              >
                {/* Effet de brillance subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />

                <div className="relative flex items-center justify-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-white/90" />
                  <span className="text-sm font-semibold text-white tracking-tight">
                    Découvrir la collection
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover/btn:translate-x-0.5 group-hover/btn:text-white transition-all" />
                </div>
              </motion.button>
            )}

            {/* Bouton Portfolio - Toujours affiché en bas si portfolio activé */}
            {hasPortfolio && (
              <motion.button
                onClick={handleNavigateToPortfolio}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="group/btn relative w-full overflow-hidden rounded-xl px-4 py-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${portfolioSettings?.brand_color || '#8B5CF6'} 0%, ${portfolioSettings?.brand_color || '#8B5CF6'}dd 100%)`
                }}
              >
                {/* Effet de brillance subtil */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />

                <div className="relative flex items-center justify-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-white/90" />
                  <span className="text-sm font-semibold text-white tracking-tight">
                    {portfolioSettings?.title || 'Mon Univers'}
                  </span>
                  
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover/btn:translate-x-0.5 group-hover/btn:text-white transition-all" />
                </div>
              </motion.button>
            )}
          </div>

          {/* Indicateur de disponibilité subtil */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Disponible immédiatement</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductDisplaySection.displayName = 'ProductDisplaySection';

export default ProductDisplaySection;
