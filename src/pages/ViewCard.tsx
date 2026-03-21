import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, Sparkles } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import BusinessCardModern from "@/components/BusinessCardModern";
import ViewCardActions from "@/components/ViewCardActions";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CardLoadingSkeleton from "@/components/ui/CardLoadingSkeleton";
import { optimizedQueries } from "@/lib/optimizedQueries";
import { getValidIPForRecording } from "@/utils/ipUtils";

type BusinessCardType = Tables<"business_cards">;
type SocialLinkType = Tables<"social_links">;
type ProductType = Tables<"products">;

interface CardData extends BusinessCardType {
  social_links?: SocialLinkType[];
  products?: ProductType[];
}

const getPublicImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("card-covers/")) {
    const { data } = supabase.storage.from("card-covers").getPublicUrl(path);
    return data?.publicUrl || "";
  }
  return path;
};

const ViewCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Optimisation avec React Query et requêtes optimisées
  const { data: card, isLoading: loading, error } = useQuery({
    queryKey: ["view-card", id],
    queryFn: async () => {
      if (!id) throw new Error("ID manquant");
      const result = await optimizedQueries.getCardWithRelations(id, false);
      // Card data fetched
      return result;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en mémoire 10 minutes
    retry: 1,
    retryDelay: 1000
  });

  // Enregistrer la vue de la carte
  useEffect(() => {
    if (card && id) {
      recordCardView(id);
    }
  }, [card, id]);

  const recordCardView = async (cardId: string) => {
    try {
      const referrer = document.referrer || '';
      const userAgent = navigator.userAgent;
      const ip = await getValidIPForRecording();

      const { error } = await supabase.rpc('record_card_view', {
        card_uuid: cardId,
        viewer_ip_param: ip,
        user_agent_param: userAgent,
        referrer_param: referrer
      });

      if (error) {
        // Error recording view - log removed
      }
    } catch (error) {
      // Error log removed
    }
  };

  // Gestion d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
        <motion.div 
          className="relative z-10 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-20 w-20 bg-gray-900 rounded-lg flex items-center justify-center shadow-md mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Impossible de charger la carte de visite.
          </p>
          <Link to="/dashboard">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-md">
              Retour au tableau de bord
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden p-4">
        <div className="relative z-10 max-w-2xl mx-auto pt-8">
          <CardLoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
        <motion.div 
          className="relative z-10 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-20 w-20 bg-gray-900 rounded-lg flex items-center justify-center shadow-md mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Carte non trouvée
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Cette carte de visite n'existe pas ou a été supprimée.
          </p>
          <Link to="/dashboard">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-md">
              Retour au tableau de bord
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const socialLinks = card?.social_links?.reduce((acc, link) => {
    if (link.platform && link.url) {
      acc[link.platform as keyof typeof acc] = link.url;
    }
    return acc;
  }, {} as Record<string, string>) || {};

  let backgroundImage = "";
  let backgroundType = "gradient";
  if (card?.cover_image_url) {
    backgroundImage = getPublicImageUrl(card.cover_image_url);
    backgroundType = backgroundImage ? "image" : "gradient";
  } else if (card?.custom_fields && typeof card.custom_fields === 'object') {
    backgroundImage = getPublicImageUrl((card.custom_fields as any).backgroundImage || "");
    backgroundType = backgroundImage ? "image" : "gradient";
  }

  // Vérifier si la carte est premium de manière sûre
  const isPremium = (card as any)?.premium === true;

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative overflow-hidden">
      <div className="max-w-md mx-auto mb-6 relative z-10">
        {/* Navigation premium */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-900 hover:text-gray-700 mb-8 group bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md rounded-lg px-4 py-3 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="relative font-semibold">
              Retour au tableau de bord
            </span>
          </Link>
        </motion.div>
        
        {/* Header premium */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold mb-4 text-gray-900 tracking-tight"
            style={{letterSpacing: '-0.02em'}}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            aria-label="Titre : Votre carte de visite"
          >
            Votre carte de visite
          </motion.h1>
          <motion.div 
            className="bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-lg p-6 mt-4 hover:shadow-md transition-all duration-200"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-700 mb-0 text-lg font-medium leading-relaxed">
              Prévisualisez votre carte de visite telle qu'elle apparaît à vos contacts.
            </p>
          </motion.div>
        </motion.div>

        {/* Card container premium */}
        <motion.div
          className="group relative bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-200 mb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          whileHover={{ 
            scale: 1.01
          }}
          aria-label="Carte de visite premium"
        >
          {/* Badge Premium */}
          {isPremium && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md z-30"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Premium
              </div>
            </motion.div>
          )}
          
          <CardContent className="p-8 bg-white">
            <BusinessCardModern
              name={card.name || ""}
              title={card.title || ""}
              company={card.company || ""}
              email={card.email || ""}
              phone={card.phone || ""}
              avatar={card.avatar_url || ""}
              backgroundImage={backgroundImage}
              socials={socialLinks}
              address={card.address || ""}
              description={card.description || ""}
              products={card.products?.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price ? `${p.price} Fcfa` : 'Prix sur demande',
                image: p.image_url
              }))}
              digitalProducts={card.digital_products?.map(dp => ({
                id: dp.id,
                title: dp.title,
                description: dp.description,
                type: dp.type,
                price: dp.price,
                currency: dp.currency,
                is_free: dp.is_free,
                thumbnail_url: dp.thumbnail_url
              }))}
              skills={(() => {
                if (!card.custom_fields) return [];
                if (typeof card.custom_fields === 'object' && card.custom_fields !== null) {
                  const cf = card.custom_fields as any;
                  if (Array.isArray(cf.skills)) return cf.skills;
                  if (typeof cf.skills === 'string') return cf.skills.split(',').map(s => s.trim()).filter(Boolean);
                }
                if (typeof card.custom_fields === 'string') {
                  try {
                    const parsed = JSON.parse(card.custom_fields);
                    if (parsed && Array.isArray(parsed.skills)) return parsed.skills;
                    if (parsed && typeof parsed.skills === 'string') return parsed.skills.split(',').map(s => s.trim()).filter(Boolean);
                  } catch {}
                }
                return [];
              })()}
            />
          </CardContent>
        </motion.div>
        
        {/* Actions premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <ViewCardActions card={card} />
        </motion.div>
      </div>
    </div>
  );
};

export default ViewCard;