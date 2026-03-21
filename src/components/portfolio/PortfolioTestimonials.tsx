import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_email?: string;
  created_at: string;
}

interface PortfolioTestimonialsProps {
  cardId: string;
  accentColor: string;
  fontFamily?: string;
}

const PortfolioTestimonials: React.FC<PortfolioTestimonialsProps> = ({
  cardId,
  accentColor,
  fontFamily = 'Poppins',
}) => {
  // Charger les avis depuis la table professional_reviews
  // Note: cardId peut être un slug ou un UUID, on doit d'abord récupérer l'UUID réel
  const { data: cardData } = useQuery({
    queryKey: ['card-id-for-reviews', cardId],
    queryFn: async () => {
      if (!cardId) return null;
      // Vérifier si c'est un UUID ou un slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardId);
      if (isUUID) {
        return { id: cardId };
      }
      // C'est un slug, récupérer l'UUID
      const { data, error } = await supabase
        .from('business_cards')
        .select('id')
        .eq('slug', cardId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!cardId,
  });

  const actualCardId = cardData?.id || cardId; // Fallback sur cardId si pas trouvé

  const { data: reviews = [] } = useQuery({
    queryKey: ['portfolio-professional-reviews', actualCardId],
    queryFn: async () => {
      if (!actualCardId) return [];
      
      const { data, error } = await supabase
        .from('professional_reviews')
        .select('*')
        .eq('professional_id', actualCardId)
        .eq('is_approved', true) // Seulement les avis approuvés
        .gte('rating', 4) // Seulement les bons avis (4-5 étoiles)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        // Error log removed
        return []; // Retourner un tableau vide au lieu de throw pour éviter les erreurs
      }
      return (data || []) as Review[];
    },
    enabled: !!actualCardId,
  });

  // Si pas d'avis, ne pas afficher la section
  if (reviews.length === 0) {
    return null;
  }

  // Générer les étoiles
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
        strokeWidth={2}
      />
    ));
  };

  return (
    <section className="py-20 px-4 relative" style={{ fontFamily }}>
      <div className="max-w-7xl mx-auto">
        {/* Titre de section Apple-style */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Témoignages
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Ce que mes clients disent de mon travail
          </p>
        </motion.div>

        {/* Grille de témoignages Apple-style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl border border-gray-100/50 overflow-hidden transition-all duration-500 hover:border-gray-200 h-full p-8">
                {/* Quote icon */}
                <div className="mb-6">
                  <Quote
                    className="w-10 h-10 opacity-20"
                    style={{ color: accentColor }}
                    strokeWidth={2}
                  />
                </div>

                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {renderStars(review.rating)}
                </div>

                {/* Commentaire */}
                <p className="text-gray-700 mb-6 leading-relaxed font-light line-clamp-4">
                  "{review.comment}"
                </p>

                {/* Séparateur */}
                <div className="border-t border-gray-200 pt-4">
                  {/* Reviewer info */}
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Nom et date */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm tracking-tight">
                        {review.reviewer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note moyenne */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 p-8 inline-block hover:shadow-2xl transition-all duration-500">
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {renderStars(5)}
                </div>
                <div className="border-l border-gray-300 pl-4">
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    {reviews.length} avis
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PortfolioTestimonials;
