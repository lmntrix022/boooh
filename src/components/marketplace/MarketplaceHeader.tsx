import React from 'react';
import { ArrowLeft, Store, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

type BusinessCardType = Tables<'business_cards'>;

interface MarketplaceHeaderProps {
  card: BusinessCardType & { products?: any[]; digital_products?: any[] };
  accentColor: string;
  onBack: () => void;
  totalProducts: number;
  fontFamily?: string;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  card,
  accentColor,
  onBack,
  totalProducts,
  fontFamily = 'Poppins',
}) => {
  const { t } = useLanguage();
  // Récupérer l'image de couverture
  const getCoverImage = () => {
    if (card.cover_image_url) {
      return card.cover_image_url.startsWith('http')
        ? card.cover_image_url
        : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/card-covers/${card.cover_image_url}`;
    }
    return null;
  };

  const coverImage = getCoverImage();

  return (
    <div className="relative overflow-hidden bg-black border-b border-white/10" style={{ fontFamily }}>
      {/* Image de couverture avec effet Apple */}
      {coverImage && (
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center transform scale-110 transition-transform duration-[10s] hover:scale-100"
            style={{
              backgroundImage: `url(${coverImage})`,
              filter: 'brightness(0.3) saturate(0.8)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
      )}

      {/* Fallback Apple-style */}
      {!coverImage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      )}

      {/* Contenu du header - Design Apple */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div>
          {/* Bouton retour Apple-style */}
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-8 text-white/90 hover:text-white hover:bg-white/5 rounded-full px-5 py-2.5 h-auto font-medium text-sm backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-white/20 hover:-translate-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
            {t('marketplace.header.back')}
          </Button>

          {/* En-tête Apple-style */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            {/* Logo Apple-style */}
            {((card as any).company_logo_url || card.avatar_url) && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden bg-white/5 shadow-2xl backdrop-blur-xl border border-white/10 hover:scale-105 hover:border-white/20 transition-all duration-500">
                  <img
                    src={(card as any).company_logo_url || card.avatar_url || ''}
                    alt={card.company || card.name || 'Logo'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Informations Apple-style */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full mb-5 border border-white/10">
                <Store className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">{t('marketplace.header.store')}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-none">
                {card.company || card.name || t('marketplace.header.defaultTitle')}
              </h1>

              {card.description && (
                <p className="text-white/70 text-base md:text-lg mb-6 max-w-2xl leading-relaxed font-light">
                  {card.description}
                </p>
              )}

              {/* Stats Apple-style */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-500">
                  <ShoppingBag className="w-5 h-5 text-white/80" strokeWidth={2} />
                  <div>
                    <p className="text-2xl font-semibold text-white tracking-tight">{totalProducts}</p>
                    <p className="text-xs text-white/60 font-medium tracking-wide">{t('marketplace.header.products')}</p>
                  </div>
                </div>

                {card.average_rating && card.average_rating > 0 && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-500">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <p className="text-2xl font-semibold text-white tracking-tight">
                        {card.average_rating.toFixed(1)}
                      </p>
                    </div>
                    <p className="text-xs text-white/60 font-medium tracking-wide">
                      {t('marketplace.header.reviews', { count: card.total_reviews || 0 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceHeader;
