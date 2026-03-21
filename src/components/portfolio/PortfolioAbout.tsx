import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Briefcase, Award, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

type BusinessCardType = Tables<'business_cards'>;

interface PortfolioAboutProps {
  card: BusinessCardType;
  accentColor: string;
  fontFamily?: string;
}

const PortfolioAbout: React.FC<PortfolioAboutProps> = ({
  card,
  accentColor,
  fontFamily = 'Poppins',
}) => {
  // Extraire les informations clés
  const keyPoints = [
    card.title && { icon: Briefcase, label: card.title },
    card.company && { icon: Award, label: card.company },
    card.address && { icon: MapPin, label: card.address },
    card.website && { icon: Globe, label: 'Site web disponible' },
  ].filter(Boolean);

  // Si pas de description et pas de points clés, ne pas afficher la section
  if (!card.description && keyPoints.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 relative" style={{ fontFamily }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Titre de section Apple-style */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              À propos
            </h2>
          </div>

          {/* Contenu Apple-style */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
              {/* Photo/Avatar si disponible */}
              {card.avatar_url && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-center"
                >
                  <div className="relative">
                    <img
                      src={card.avatar_url}
                      alt={card.name || 'Photo'}
                      className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-3xl shadow-2xl"
                    />
                    <div
                      className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl blur-3xl opacity-50"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Texte et points clés */}
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col justify-center"
              >
                {/* Description */}
                {card.description && (
                  <p className="text-lg text-gray-700 leading-relaxed mb-8 font-light">
                    {card.description}
                  </p>
                )}

                {/* Points clés - Apple badges */}
                {keyPoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Informations clés
                    </h3>
                    <div className="space-y-3">
                      {keyPoints.map((point, index) => {
                        if (!point) return null;
                        const Icon = point.icon;
                        return (
                          <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Badge
                              className="px-5 py-3 text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                            >
                              <Icon className="w-4 h-4 mr-2" strokeWidth={2} />
                              {point.label}
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contact info complémentaire */}
                {(card.email || card.phone) && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="space-y-2">
                      {card.email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Email :</span>{' '}
                          <a
                            href={`mailto:${card.email}`}
                            className="hover:underline transition-colors"
                            style={{ color: accentColor }}
                          >
                            {card.email}
                          </a>
                        </p>
                      )}
                      {card.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">Téléphone :</span>{' '}
                          <a
                            href={`tel:${card.phone}`}
                            className="hover:underline transition-colors"
                            style={{ color: accentColor }}
                          >
                            {card.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioAbout;
