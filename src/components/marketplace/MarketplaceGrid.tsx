import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Download, Eye, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CardImageOptimizer from '../utils/CardImageOptimizer';
import { useCart } from '@/contexts/CartContext';
import { formatAmount } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  images?: Array<{ url: string; alt: string; order: number }>;
  description?: string;
  type: 'physical' | 'digital';
  fileUrl?: string;
  previewUrl?: string;
}

interface MarketplaceGridProps {
  products: Product[];
  columns: 2 | 3;
  accentColor: string;
  cardId: string;
}

const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({
  products,
  columns,
  cardId,
}) => {
  const navigate = useNavigate();
  const { addItem, isInCart, getItemQuantity } = useCart();
  const { t } = useLanguage();

  const handleProductClick = (product: Product) => {
    // Navigation vers la page détail produit
    navigate(`/card/${cardId}/marketplace/product/${product.id}`, {
      state: { product },
    });
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();

    // Récupérer la première image (tous les formats possibles)
    let primaryImage = '';
    if (product.images && product.images.length > 0) {
      primaryImage = product.images[0].url;
    } else if ((product as any).image_url) {
      primaryImage = (product as any).image_url;
    } else if ((product as any).image) {
      primaryImage = (product as any).image;
    }

    addItem({
      id: `${cardId}-${product.id}`,
      productId: product.id,
      cardId: cardId,
      name: product.name,
      price: product.price,
      type: product.type,
      image: primaryImage,
    }, 1);
  };

  const gridClass = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.5,
          }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group cursor-pointer"
          onClick={() => handleProductClick(product)}
        >
          {/* Apple-style card */}
          <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl border border-gray-100/50 overflow-hidden transition-all duration-500 hover:border-gray-200">
            {/* Image du produit - Apple style */}
            <div className="relative h-72 bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
              {/* Badge type - Apple minimalist */}
              <div className="absolute top-4 left-4 z-10">
                <div className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-xl text-gray-900 text-xs font-semibold shadow-lg border border-gray-100/50 flex items-center gap-2 hover:bg-white transition-all duration-500">
                  {product.type === 'physical' ? (
                    <>
                      <Package className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {t('marketplace.grid.physical')}
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {t('marketplace.grid.digital')}
                    </>
                  )}
                </div>
              </div>

              {/* Multiple images indicator - Apple style */}
              {product.images && product.images.length > 1 && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl">
                    <Eye className="w-3 h-3" strokeWidth={2.5} />
                    {product.images.length}
                  </div>
                </div>
              )}

              {/* Image - Afficher la première image du produit */}
              {(() => {
                // Récupérer la première image (nouveau format avec images[] ou ancien avec image)
                const primaryImage = product.images && product.images.length > 0
                  ? product.images[0].url
                  : product.image;

                return primaryImage ? (
                  <CardImageOptimizer
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    type="product"
                    priority={index < 6}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    <ShoppingCart className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                  </div>
                );
              })()}

              {/* Overlay gradient - Apple style */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Informations du produit - Apple typography */}
            <div className="p-6 bg-white">
              {/* Nom du produit - Apple bold */}
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 tracking-tight leading-tight">
                {product.name}
              </h3>

              {/* Description - Apple light */}
              {product.description && (
                <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed font-light">
                  {product.description}
                </p>
              )}

              {/* Prix - Apple large pricing */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
                    {product.price > 0 ? formatAmount(product.price) : t('marketplace.grid.free')}
                  </p>
                </div>

                {/* Badge quantité si dans le panier - Apple style */}
                {isInCart(product.id) && (
                  <div className="px-3 py-1.5 bg-black/5 text-black rounded-full text-xs font-bold border border-black/10">
                    {t('marketplace.grid.inCart', { count: getItemQuantity(product.id) })}
                  </div>
                )}
              </div>

              {/* Boutons d'action - Apple minimal */}
              <div className="flex gap-3">
                {/* Bouton Ajouter au panier - Apple black button */}
                <Button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="flex-1 bg-black hover:bg-gray-800 text-white rounded-full h-12 font-semibold text-sm tracking-wide transition-all duration-500 hover:shadow-xl hover:scale-105 border-none"
                >
                  <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  {t('marketplace.grid.add')}
                </Button>

                {/* Bouton Voir détails - Apple outline button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  variant="outline"
                  className="flex-1 rounded-full h-12 font-semibold text-sm bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 transition-all duration-500 tracking-wide hover:scale-105"
                >
                  <Eye className="w-4 h-4 mr-2" strokeWidth={2.5} />
                  {t('marketplace.grid.view')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MarketplaceGrid;
