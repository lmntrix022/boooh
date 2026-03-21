import React from 'react';
import { ArrowLeft, Sparkles, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

type BusinessCardType = Tables<'business_cards'>;

interface PortfolioHeaderProps {
  card: BusinessCardType;
  accentColor: string;
  onBack: () => void;
  totalProjects: number;
  fontFamily?: string;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  card,
  accentColor,
  onBack,
  totalProjects,
  fontFamily = 'Poppins',
}) => {
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
            className="mb-8 text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-5 py-2.5 h-auto font-light text-sm border border-white/20 transition-all duration-300"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
            Retour
          </Button>

          {/* En-tête Apple-style */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            {/* Logo de l'entreprise Apple-style */}
            {((card as any).company_logo_url || card.avatar_url) && (
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-white/5 shadow-sm border border-white/20 hover:scale-105 transition-all duration-300 p-2">
                  <img
                    src={(card as any).company_logo_url || card.avatar_url}
                    alt={card.company || card.name || 'Logo'}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Informations Apple-style */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-lg mb-5 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                <span className="text-white/90 text-xs font-light tracking-wider uppercase"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Portfolio</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 tracking-tight leading-none"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >
                {card.name || 'Mon Portfolio'}
              </h1>

              {card.title && (
                <p className="text-white/70 text-base md:text-lg mb-6 max-w-2xl leading-relaxed font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {card.title}
                </p>
              )}

              {/* Compétences */}
              {(card.custom_fields as any)?.skills && Array.isArray((card.custom_fields as any).skills) && (card.custom_fields as any).skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {(card.custom_fields as any).skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full text-white/90 text-sm font-medium border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Apple-style */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition-all duration-300">
                  <Sparkles className="w-5 h-5 text-white/80" strokeWidth={2} />
                  <div>
                    <p className="text-2xl font-light text-white tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >{totalProjects}</p>
                    <p className="text-xs text-white/60 font-light tracking-wide"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Projets</p>
                  </div>
                </div>

                {card.company && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition-all duration-300">
                    <Briefcase className="w-5 h-5 text-white/80" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-light text-white tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                        }}
                      >{card.company}</p>
                      <p className="text-xs text-white/60 font-light tracking-wide"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >Entreprise</p>
                    </div>
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

export default PortfolioHeader;
