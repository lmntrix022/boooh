import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Code, Palette, Rocket, Cpu, Lightbulb, Briefcase, Target, TrendingUp, Award, Star, Heart, Smile, Package, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { PortfolioServiceType, PortfolioService as PortfolioServiceClass } from '@/services/portfolioService';

interface PortfolioServicesProps {
  accentColor: string;
  fontFamily?: string;
  cardId: string;
  onContact?: () => void;
  onRequestQuote?: (serviceName: string) => void;
}

// Mapping des icônes disponibles
const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  zap: Zap,
  code: Code,
  palette: Palette,
  rocket: Rocket,
  cpu: Cpu,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  target: Target,
  trending: TrendingUp,
  award: Award,
  star: Star,
  heart: Heart,
  smile: Smile,
  package: Package,
};

const PortfolioServices: React.FC<PortfolioServicesProps> = ({
  accentColor,
  fontFamily = 'Poppins',
  cardId,
  onContact,
  onRequestQuote,
}) => {
  // Charger les services depuis la base de données
  // Utilise getPublishedCardServices pour filtrer uniquement les services liés à cette carte
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['portfolio-card-services', cardId],
    queryFn: async () => {
      const result = await PortfolioServiceClass.getPublishedCardServices(cardId);
      return result as PortfolioServiceType[];
    },
    enabled: !!cardId,
  });
  const services: PortfolioServiceType[] = servicesData || [];

  // Ne pas afficher la section s'il n'y a pas de services
  if (isLoading) {
    return null;
  }

  if (services.length === 0) {
    return null;
  }

  // Formater le prix selon le type
  const formatPrice = (service: PortfolioServiceType) => {
    if (service.price_label) {
      return service.price_label;
    }

    switch (service.price_type) {
      case 'free':
        return 'Gratuit';
      case 'fixed':
        return service.price ? `${service.price}FCFA` : 'Sur devis';
      case 'from':
        return service.price ? `À partir de ${service.price}FCFA` : 'Sur devis';
      case 'custom':
      default:
        return 'Sur devis';
    }
  };

  return (
    <section className="py-12 sm:py-20 px-4 relative bg-gray-50/50" style={{ fontFamily }}>
      <div className="max-w-7xl mx-auto">
        {/* Titre de section Apple-style */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Mes Services
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Découvrez comment je peux vous aider à réaliser vos projets
          </p>
        </motion.div>

        {/* Grille de services Apple-style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, index) => {
            const Icon = ICON_MAP[service.icon || 'sparkles'] || Sparkles;
            return (
              <motion.div
                key={service.id}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md hover:shadow-2xl border border-gray-100/50 overflow-hidden transition-all duration-500 hover:border-gray-200 h-full p-6 sm:p-8">
                  {/* Icône */}
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${accentColor}15`,
                    }}
                  >
                    <Icon
                      className="w-6 h-6 sm:w-8 sm:h-8"
                      strokeWidth={2}
                      style={{ color: accentColor }}
                    />
                  </div>

                  {/* Titre */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 tracking-tight">
                    {service.title}
                  </h3>

                  {/* Description */}
                  {service.description && (
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed font-light">
                      {service.description}
                    </p>
                  )}

                  {/* Prix */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                      {formatPrice(service)}
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => {
                      if (service.cta_url) {
                        window.open(service.cta_url, '_blank');
                      } else if (onRequestQuote) {
                        onRequestQuote(service.title);
                      } else if (onContact) {
                        onContact();
                      }
                    }}
                    className="w-full rounded-full h-10 sm:h-12 font-semibold text-xs sm:text-sm bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg"
                  >
                    <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-2" strokeWidth={2.5} />
                    {service.cta_label}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Section personnalisable */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-6 sm:p-8 hover:shadow-2xl transition-all duration-500">
            <Cpu className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4" style={{ color: accentColor }} />
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              Besoin d'un service sur mesure ?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-2xl mx-auto font-light">
              Chaque projet est unique. Discutons de vos besoins spécifiques pour créer une solution adaptée.
            </p>
            <Button
              onClick={() => {
                if (onRequestQuote) {
                  onRequestQuote('Service sur mesure');
                } else if (onContact) {
                  onContact();
                }
              }}
              size="lg"
              className="rounded-full px-6 sm:px-10 py-4 sm:py-6 text-sm sm:text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Obtenez un devis 
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioServices;
