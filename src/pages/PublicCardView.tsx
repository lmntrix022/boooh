import React, { useEffect, useState, lazy, Suspense, memo, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Sparkles, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import BusinessCardModern from "@/components/BusinessCardModern";
import PublicCardActions from "@/components/PublicCardActions";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RatingDisplay from "@/components/reviews/RatingDisplay";
import ProfessionalReviewCard from "@/components/reviews/ProfessionalReviewCard";
import ProfessionalReviewForm from "@/components/reviews/ProfessionalReviewForm";
import { ProfessionalReviewWithVotes, ProfessionalReviewFormData } from "@/types/reviews";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CardLoadingSkeleton from "@/components/ui/CardLoadingSkeleton";
import { optimizedQueries } from "@/lib/optimizedQueries";
import { getValidIPForRecording } from "@/utils/ipUtils";
import { PortfolioService } from "@/services/portfolioService";
import { useSEO } from "@/hooks/useSEO";
import { SchemaBreadcrumb } from "@/components/SEO/SchemaBreadcrumb";
import { useLanguage } from "@/hooks/useLanguage";
import { getCardEvents } from "@/services/eventService";
import { AnimatedOrbs } from "@/components/ui/AnimatedOrbs";
import { RealityLayerProvider } from "@/contexts/RealityLayerContext";
import { RealityLayerCard } from "@/components/card/RealityLayerCard";
import { OSDrawer } from "@/components/card/OSDrawer";

/** When wrap is false (e.g. from CardController), children are not wrapped in RealityLayerCard. */
function CardOrPlain({ children, wrap }: { children: React.ReactNode; wrap: boolean }) {
  return wrap ? <RealityLayerCard>{children}</RealityLayerCard> : <>{children}</>;
}

type BusinessCardType = Tables<"business_cards">;
type SocialLinkType = Tables<"social_links">;
type ProductType = Tables<"products">;
type MediaContentType = Tables<"media_content">;

interface CardData extends Omit<BusinessCardType, 'social_links' | 'products' | 'media_content'> {
  social_links?: SocialLinkType[];
  products?: ProductType[];
  media_content?: MediaContentType[];
  digital_products?: any[];
}

const getPublicImageUrl = (path: string): string => {
  try {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("card-covers/")) {
      const { data } = supabase.storage.from("card-covers").getPublicUrl(path);
      return data?.publicUrl || "";
    }
    return path;
  } catch (error) {
    // Error log removed
    return ""; // Retourner une chaîne vide en cas d'erreur
  }
};

// ═══════════════════════════════════════════════════════════
// PREMIUM BACKGROUND - AWWWARDS/APPLE LEVEL ENHANCED
// ═══════════════════════════════════════════════════════════
const PremiumBackground = memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Base gradient ultra-subtil */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] via-white to-[#f8f9fa]" />

    {/* Mesh gradient premium multi-couches - inspiré Apple iPhone */}
    <motion.div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% -10%, rgba(139, 92, 246, 0.12), transparent 60%),
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.08), transparent),
          radial-gradient(ellipse 70% 40% at 100% 100%, rgba(255, 182, 193, 0.06), transparent),
          radial-gradient(ellipse 60% 35% at 0% 80%, rgba(173, 216, 230, 0.05), transparent),
          radial-gradient(ellipse 50% 30% at 20% 50%, rgba(139, 92, 246, 0.04), transparent)
        `
      }}
      animate={{
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />

    {/* Grid lines subtiles pour profondeur architecturale */}
    <div 
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 100% 100% at center, black 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at center, black 40%, transparent 70%)',
      }}
    />

    {/* Grain texture ultra-subtil pour profondeur */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }}
    />

    {/* Ligne de lumière premium en haut */}
    <motion.div 
      className="absolute top-0 left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(to right, transparent, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2), transparent)',
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />

    {/* Ligne de lumière en bas */}
    <motion.div 
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(to right, transparent, rgba(255, 182, 193, 0.15), transparent)',
      }}
      animate={{
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
  </div>
));
PremiumBackground.displayName = 'PremiumBackground';

// Composant orbes flottants animés premium - AWWWARDS LEVEL
const FloatingOrbs = memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Orbe principal violet - top right */}
    <motion.div
      className="absolute w-[700px] h-[700px] rounded-full blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)',
        top: '-15%',
        right: '-15%',
      }}
      animate={{
        y: [0, 40, 0],
        x: [0, -30, 0],
        scale: [1, 1.15, 1],
        opacity: [0.6, 0.8, 0.6],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    
    {/* Orbe bleu - bottom left */}
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.03) 40%, transparent 70%)',
        bottom: '-10%',
        left: '-20%',
      }}
      animate={{
        y: [0, -35, 0],
        x: [0, 20, 0],
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.7, 0.5],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    />

    {/* Orbe rose - center right */}
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(255, 182, 193, 0.05) 0%, rgba(255, 182, 193, 0.02) 40%, transparent 70%)',
        top: '50%',
        right: '-10%',
      }}
      animate={{
        y: [0, 25, 0],
        x: [0, -15, 0],
        scale: [1, 1.08, 1],
        opacity: [0.4, 0.6, 0.4],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 4,
      }}
    />

    {/* Orbe cyan - top left */}
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
      style={{
        background: 'radial-gradient(circle, rgba(173, 216, 230, 0.04) 0%, rgba(173, 216, 230, 0.02) 40%, transparent 70%)',
        top: '10%',
        left: '-10%',
      }}
      animate={{
        y: [0, 20, 0],
        x: [0, 10, 0],
        scale: [1, 1.05, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
  </div>
));
FloatingOrbs.displayName = 'FloatingOrbs';

interface PublicCardViewProps {
  /** When provided (e.g. from CardController), card is used and owner UI is not rendered here. */
  cardFromController?: CardData | null;
}

const PublicCardView: React.FC<PublicCardViewProps> = ({ cardFromController }) => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [cardUrl, setCardUrl] = useState<string>("");
  const fromController = cardFromController !== undefined;

  // États pour les avis
  const [reviews, setReviews] = useState<ProfessionalReviewWithVotes[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const previousReviewsIdsRef = useRef<string>('');

  // Set the current URL for the QR code
  useEffect(() => {
    setCardUrl(window.location.href);
  }, []);

  // Optimisation avec React Query et requêtes optimisées (désactivé quand le Controller fournit la carte)
  const { data: cardFromQuery, isLoading: loading, error } = useQuery({
    queryKey: ["public-card", id],
    queryFn: async () => {
      if (!id) throw new Error(t('publicCardActions.errors.missingId'));
      return await optimizedQueries.getCardWithRelations(id, true);
    },
    enabled: !!id && !fromController,
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garde en mémoire 10 minutes
    retry: 1,
    retryDelay: 1000
  });

  const card = fromController ? cardFromController ?? null : (cardFromQuery ?? null);
  const effectiveLoading = !fromController && loading;

  // Portfolio queries en parallèle (optimisation performance)
  // Utiliser card?.id (UUID) au lieu de id (qui peut être un slug)
  const { data: portfolioSettings } = useQuery({
    queryKey: ["portfolio-settings", card?.id],
    queryFn: async () => {
      if (!card?.id) return null;
      return await PortfolioService.getCardSettings(card.id);
    },
    enabled: !!card?.id,
    staleTime: 5 * 60 * 1000
  });

  // Charger les projets en parallèle (plus besoin d'attendre settings)
  const { data: portfolioProjects = [] } = useQuery({
    queryKey: ["portfolio-projects-count", card?.id],
    queryFn: async () => {
      if (!card?.id) return [];
      return await PortfolioService.getCardProjects(card.id);
    },
    enabled: !!card?.id, // Utiliser l'UUID de la carte récupérée
    staleTime: 5 * 60 * 1000
  });

  // Charger les événements de la carte
  const { data: cardEvents = [] } = useQuery({
    queryKey: ['card-events', card?.id],
    queryFn: async () => {
      if (!card?.id) return [];
      return await getCardEvents(card.id);
    },
    enabled: !!card?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Rediriger vers l'URL avec slug si disponible (pour SEO et URLs propres)
  useEffect(() => {
    if (card && (card as any).slug && id && id !== (card as any).slug) {
      // Si on a un slug et que l'URL actuelle utilise l'UUID, rediriger vers le slug
      const slugUrl = `/card/${(card as any).slug}`;
      // Utiliser replace pour ne pas ajouter une entrée dans l'historique
      window.history.replaceState(null, '', slugUrl);
    }
  }, [card, id]);

  // Enregistrer la vue de la carte (non-bloquant, async)
  useEffect(() => {
    if (card && card.id) {
      // Fire-and-forget pour ne pas bloquer le rendu
      recordCardView(card.id).catch(() => { }); // Erreur silencieuse
    }
  }, [card]);

  // Charger les avis de manière non-bloquante avec React Query
  // Utiliser card.id (UUID) au lieu de id (qui peut être un slug)
  const { data: reviewsData = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["professional-reviews", card?.id],
    queryFn: async () => {
      if (!card?.id) return [];
      const { data, error } = await supabase
        .from('professional_reviews')
        .select(`
          *,
          professional_review_votes(*)
        `)
        .eq('professional_id', card.id) // Utiliser l'UUID réel
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        // Error log removed
        return []; // Retourner un tableau vide au lieu de throw pour éviter les erreurs
      }
      return data || [];
    },
    enabled: !!card?.id, // Utiliser card.id au lieu de id
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });

  // Synchroniser avec l'état local pour compatibilité (uniquement si les données changent réellement)
  useEffect(() => {
    if (reviewsData && reviewsData.length > 0) {
      // Comparer par IDs pour éviter les mises à jour inutiles
      const newIds = reviewsData.map((r: any) => r.id).sort().join(',');
      if (newIds !== previousReviewsIdsRef.current) {
        previousReviewsIdsRef.current = newIds;
        setReviews(reviewsData as ProfessionalReviewWithVotes[]);
      }
    } else if (reviewsData && reviewsData.length === 0 && previousReviewsIdsRef.current !== '') {
      // Si reviewsData devient vide, réinitialiser aussi
      previousReviewsIdsRef.current = '';
      setReviews([]);
    }
  }, [reviewsData]);

  // SEO Meta Tags dynamiques basés sur la carte - Mémorisés pour éviter les re-renders
  const seoMeta = useMemo(() => {
    const cardData = card as any;
    const dynamicTitle = cardData?.name
      ? t('publicCard.seo.titleTemplate', { name: cardData.name })
      : t('publicCard.seo.defaultTitle');

    const dynamicDescription = cardData?.bio
      ? t('publicCard.seo.descriptionTemplate', { bio: cardData.bio.substring(0, 150), name: cardData.name })
      : t('publicCard.seo.defaultDescription');

    const dynamicImage = cardData?.profile_image_url
      ? getPublicImageUrl(cardData.profile_image_url)
      : 'https://booh.ga/og-image-default.png';

    return {
      title: dynamicTitle,
      description: dynamicDescription,
      image: dynamicImage,
      url: `https://booh.ga/c/${id}`,
      type: 'website' as const,
      keywords: cardData ? t('publicCard.seo.keywordsTemplate', { name: cardData.name, jobTitle: cardData.job_title || 'professionnel' }) : t('publicCard.seo.defaultKeywords')
    };
  }, [card, id, t]);

  useSEO(seoMeta);

  // Gestion d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-100 p-4 relative overflow-hidden">
        <AnimatedOrbs />
        <motion.div
          className="relative z-10 text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-20 w-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 animate-float">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {t('publicCard.notFound.title')}
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            {t('publicCard.notFound.description')}
          </p>
          <Link to="/dashboard">
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg">
              {t('publicCard.notFound.backToDashboard')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // loadProfessionalReviews supprimé - géré par React Query maintenant

  const handleSubmitReview = async (formData: ProfessionalReviewFormData) => {
    setIsSubmittingReview(true);
    try {
      // Validation des données
      if (!formData.reviewer_name || !formData.reviewer_email || !formData.rating) {
        throw new Error(t('publicCard.reviews.fieldsRequired'));
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.reviewer_email)) {
        throw new Error(t('publicCard.reviews.invalidEmail'));
      }

      // Upload des images si présentes
      let imageUrls: string[] = [];
      if (formData.images && formData.images.length > 0) {
        // Validation de la taille des images (max 5MB par image)
        const maxSize = 5 * 1024 * 1024; // 5MB
        for (const file of formData.images) {
          if (file.size > maxSize) {
            throw new Error(t('publicCard.reviews.imageTooLarge', { name: file.name }));
          }

          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { data, error } = await supabase.storage
            .from('review-images')
            .upload(fileName, file);

          if (error) {
            // Error log removed
            throw new Error(t('publicCard.reviews.uploadError', { error: error.message }));
          }
          imageUrls.push(data.path);
        }
      }

      // Créer l'avis
      const { error } = await supabase
        .from('professional_reviews')
        .insert({
          professional_id: id!,
          reviewer_name: formData.reviewer_name,
          reviewer_email: formData.reviewer_email,
          rating: formData.rating,
          title: formData.title || null,
          comment: formData.comment,
          images: imageUrls.length > 0 ? imageUrls : null,
          review_type: formData.review_type,
          service_category: formData.service_category || null,
          is_verified_contact: formData.is_verified_contact,
          is_approved: true // Auto-approuvé pour l'instant
        });

      if (error) {
        // Error log removed
        throw new Error(t('publicCard.reviews.createError', { error: error.message }));
      }

      toast({
        title: t('publicCard.reviews.published'),
        description: t('publicCard.reviews.publishedDescription'),
      });

      setShowReviewForm(false);

      // Invalider le cache React Query pour recharger les avis (sans recharger toute la page)
      queryClient.invalidateQueries({ queryKey: ["professional-reviews", id] });
    } catch (error: any) {
      // Error log removed
      toast({
        title: t('publicCard.reviews.error'),
        description: error.message || t('publicCard.reviews.errorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      // Mettre à jour l'état local immédiatement pour l'UX
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, helpful_votes: (review.helpful_votes ?? 0) + (isHelpful ? 1 : -1) }
          : review
      ));

      // Enregistrer le vote en base de données
      const { error } = await supabase
        .from('professional_review_votes')
        .insert({
          review_id: reviewId,
          is_helpful: isHelpful
        } as any);

      if (error) {
        // Error log removed
        // Revert the local state if the database operation failed
        setReviews(prev => prev.map(review =>
          review.id === reviewId
            ? { ...review, helpful_votes: (review.helpful_votes ?? 0) - (isHelpful ? 1 : -1) }
            : review
        ));
      }
    } catch (error) {
      // Error log removed
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    try {
      // Enregistrer le signalement
      const { error } = await (supabase as any)
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reason: reason,
          reported_at: new Date().toISOString()
        });

      if (error) {
        // Error log removed
        toast({
          title: t('publicCard.reviews.error'),
          description: t('publicCard.reviews.errorReport'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('publicCard.reviews.reportTitle'),
          description: t('publicCard.reviews.reportDescription'),
        });
      }
    } catch (error) {
      // Error log removed
      toast({
        title: t('publicCard.reviews.error'),
        description: t('publicCard.reviews.errorReport'),
        variant: "destructive",
      });
    }
  };

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
        // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
      }
    } catch (error) {
      // Error log removed
      // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
    }
  };

  if (effectiveLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <PremiumBackground />
        <FloatingOrbs />
        <div className="relative z-10 flex items-start justify-center px-4 py-6 md:py-12 min-h-screen">
          <CardLoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
        <PremiumBackground />
        <FloatingOrbs />

        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ombre */}
          <div className="absolute -inset-px rounded-[32px] bg-black/[0.02] translate-y-2 scale-[0.99]" />

          {/* Card */}
          <div className="relative bg-white rounded-[28px] p-8 ring-1 ring-black/[0.04] text-center">
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/80 pointer-events-none" />

            {/* Icône animée */}
            <motion.div
              className="relative w-20 h-20 mx-auto mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              {/* Cercles de pulse */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gray-900"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <motion.h1
              className="text-xl font-bold text-gray-900 mb-2 tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t('publicCard.notFound.title')}
            </motion.h1>

            <motion.p
              className="text-gray-500 mb-6 text-[15px] leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t('publicCard.notFound.notFoundAlt')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/">
                <motion.button
                  className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-medium text-[15px] transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('publicCard.notFound.backToHome')}
                </motion.button>
              </Link>
            </motion.div>
          </div>
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

  // Extraire les sites web (platform = 'website')
  const websites = card?.social_links?.filter(link => link.platform === 'website').map(link => ({
    id: link.id || `website-${Date.now()}`,
    platform: link.platform,
    url: link.url,
    label: link.label || 'Site Web',
    image: link.image ?? undefined
  })) || [];

  let backgroundImage = "";
  let backgroundType = "gradient";
  if (card?.cover_image_url) {
    backgroundImage = getPublicImageUrl(card.cover_image_url);
    backgroundType = backgroundImage ? "image" : "gradient";
  } else if (card?.custom_fields && typeof card.custom_fields === 'object') {
    backgroundImage = getPublicImageUrl((card.custom_fields as any).backgroundImage || "");
    backgroundType = backgroundImage ? "image" : "gradient";
  }

  // Format products for display
  const formattedProducts = card.products?.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price ? `${p.price} Fcfa` : t('publicCardActions.priceOnRequest'),
    image: p.image_url ?? undefined
  }));

  const pageContent = (
      <div className="min-h-screen relative overflow-hidden">
        {/* Premium Background */}
        <PremiumBackground />
        <FloatingOrbs />

        {/* SEO Components */}
        <SchemaBreadcrumb items={[
        { name: t('publicCard.breadcrumb.home'), url: 'https://booh.ga' },
        { name: t('publicCard.breadcrumb.card'), url: `https://booh.ga/c/${id}` }
      ]} />

      {/* H1 structuré pour SEO (non visible) */}
      <h1 className="sr-only">{card?.name || t('publicCard.breadcrumb.card')} - {t('publicCard.seo.defaultTitle')}</h1>

      {/* Container principal avec safe area */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Spacer pour le haut */}
        <div className="h-[env(safe-area-inset-top,0px)]" />

        {/* Contenu centré - Layer 0 (carte) ; Layer 1 (owner) = edit + drawer (ou OwnerHUD si fromController) */}
        <div className="flex-1 flex items-start justify-center px-4 py-6 md:py-12">
          <CardOrPlain wrap={!fromController}>
          <div className="w-full max-w-[420px]">

            {/* Card principale - Design AWWWARDS APPLE LEVEL ENHANCED */}
            <motion.div
              className="relative"
              style={{ willChange: 'transform, opacity' }}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
            >
              {/* Glow effect premium derrière la carte - multi-couches */}
              <motion.div 
                className="absolute -inset-6 bg-gradient-to-b from-white/60 via-purple-500/10 to-transparent blur-3xl opacity-60 pointer-events-none"
                animate={{
                  opacity: [0.5, 0.7, 0.5],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="absolute -inset-4 bg-gradient-to-b from-white/40 via-blue-500/5 to-transparent blur-2xl opacity-50 pointer-events-none" />

              {/* Container de la carte avec effet de profondeur 3D */}
              <motion.div
                className="relative group"
                style={{ 
                  perspective: 1000,
                  willChange: 'transform',
                  transformStyle: 'preserve-3d'
                }}
                whileHover={{ 
                  y: -6,
                  rotateX: 2,
                  transition: { 
                    duration: 0.5, 
                    ease: [0.16, 1, 0.3, 1],
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  } 
                }}
              >
                {/* Ombre multicouche premium avec glow coloré */}
                <motion.div 
                  className="absolute -inset-px rounded-[32px] bg-gradient-to-b from-purple-500/[0.08] via-blue-500/[0.04] to-black/[0.06] blur-2xl translate-y-6 scale-[0.96] opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
                />
                <div className="absolute -inset-px rounded-[32px] bg-gradient-to-b from-black/[0.04] to-black/[0.10] blur-xl translate-y-4 scale-[0.98] opacity-60" />
                <div className="absolute -inset-px rounded-[32px] bg-gradient-to-b from-black/[0.02] to-black/[0.06] translate-y-2 scale-[0.99]" />

                {/* Carte principale avec glassmorphism premium */}
                <div 
                  className="relative bg-white/98 backdrop-blur-xl rounded-[28px] overflow-hidden ring-1 ring-black/[0.04] shadow-2xl"
                  style={{ 
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {/* Bordure intérieure lumineuse avec gradient */}
                  <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/80 pointer-events-none z-50" />
                  
                  {/* Overlay gradient subtil pour profondeur */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none z-40" />
                  
                  {/* Reflet lumineux en haut */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-30"
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  <CardContent className="p-0 bg-white">
                    <BusinessCardModern
                      name={card.name || ""}
                      title={card.title || ""}
                      company={card.company || ""}
                      companyLogo={(card as any).company_logo_url || ""}
                      email={card.email || ""}
                      phone={card.phone || ""}
                      avatar={card.avatar_url || ""}
                      backgroundImage={backgroundImage}
                      socials={socialLinks}
                      websites={websites}
                      address={card.address || ""}
                      description={card.description || ""}
                      skills={(() => {
                        try {
                          if (!card.custom_fields) return [];
                          if (typeof card.custom_fields === 'object' && card.custom_fields !== null) {
                            const cf = card.custom_fields as any;
                            if (Array.isArray(cf.skills)) return cf.skills;
                          }
                          if (typeof card.custom_fields === 'string') {
                            try {
                              const parsed = JSON.parse(card.custom_fields);
                              if (parsed && Array.isArray(parsed.skills)) return parsed.skills;
                            } catch (parseError) {
                              // Warning log removed
                            }
                          }
                          return [];
                        } catch (error) {
                          // Error log removed
                          return [];
                        }
                      })()}
                      cardId={card.id}
                      cardUrl={cardUrl}
                      products={formattedProducts}
                      digitalProducts={card.digital_products?.map((dp: any) => ({
                        id: dp.id,
                        title: dp.title,
                        description: dp.description,
                        type: dp.type,
                        price: dp.price,
                        currency: dp.currency,
                        is_free: dp.is_free,
                        thumbnail_url: dp.thumbnail_url,
                        file_url: dp.file_url,
                        preview_url: dp.preview_url
                      })) || []}
                      mediaContent={card.media_content?.map(media => ({
                        id: media.id,
                        type: media.type,
                        url: media.url,
                        thumbnail_url: media.thumbnail_url ?? undefined,
                        duration: media.duration ?? undefined
                      }))}
                      portfolioSettings={portfolioSettings as any}
                      portfolioProjectsCount={portfolioProjects.length}
                      events={cardEvents.map(event => ({
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        event_type: event.event_type,
                        start_date: event.start_date,
                        end_date: event.end_date,
                        location_name: event.location_name,
                        cover_image_url: event.cover_image_url,
                        is_free: event.is_free,
                        current_attendees: event.current_attendees,
                        max_capacity: event.max_capacity,
                        has_live_stream: event.has_live_stream,
                        live_stream_status: (event.live_stream_status === 'replay' ? 'ended' : event.live_stream_status) as 'scheduled' | 'live' | 'ended' | undefined
                      }))}
                    />
                  </CardContent>
                </div>
              </motion.div>
            </motion.div>

            {/* Section Avis - Design Premium AWWWARDS LEVEL */}
            <motion.div
              className="mt-8"
              style={{ willChange: 'transform, opacity' }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.7, 
                delay: 0.3, 
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
            >
              {/* Shadow layers premium avec glow coloré */}
              <div className="relative">
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-b from-purple-500/[0.06] via-blue-500/[0.03] to-black/5 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  whileHover={{ opacity: 1 }}
                />
                <div className="absolute -inset-0.5 bg-gradient-to-b from-black/4 to-black/6 rounded-[26px] blur-md" />

                <div className="relative bg-white/97 backdrop-blur-xl rounded-[24px] p-6 md:p-7 ring-1 ring-black/[0.03] shadow-xl overflow-hidden">
                  {/* Inner glow premium */}
                  <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/70 pointer-events-none" />
                  
                  {/* Gradient overlay subtil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-50/20 pointer-events-none" />

                  {/* Titre avec icône premium */}
                  <div className="text-center mb-6 relative z-10">
                    <motion.div 
                      className="flex items-center justify-center gap-3 mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <motion.div 
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg ring-2 ring-yellow-300/30"
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <Star className="w-5 h-5 text-white fill-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 700 }}>
                        {t('publicCard.reviews.title')}
                      </h3>
                    </motion.div>

                    {/* Note et statistiques avec design premium */}
                    {(() => {
                      const calculatedAverage = reviews.length > 0
                        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
                        : 0;
                      const displayRating = (card.average_rating && card.average_rating > 0)
                        ? card.average_rating
                        : (calculatedAverage > 0 ? calculatedAverage : 0);
                      const displayCount = reviews.length > 0
                        ? reviews.length
                        : (card.total_reviews || 0);

                      return (displayRating > 0 || displayCount > 0) ? (
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <div className="text-4xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {displayRating.toFixed(1)}
                          </div>
                          <div className="text-left">
                            <RatingDisplay rating={displayRating} size="md" showCount={false} />
                            <p className="text-sm text-gray-600 mt-1 font-medium">
                              {t('publicCard.reviews.reviewsCount', { count: displayCount })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center mb-6 py-2">
                          <p className="text-sm text-gray-500">{t('publicCard.reviews.noReviews')}</p>
                        </div>
                      );
                    })()}

                    {/* Boutons d'action premium AWWWARDS LEVEL */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                      <motion.button
                        onClick={() => setShowAllReviews(true)}
                        className="group relative flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl font-semibold text-[15px] shadow-xl overflow-hidden ring-1 ring-gray-800/50"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {/* Shine effect premium */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-900/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                        <MessageSquare className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{t('publicCard.reviews.seeReviews')}</span>
                      </motion.button>

                      <motion.button
                        onClick={() => setShowReviewForm(true)}
                        className="group relative flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-[15px] shadow-xl overflow-hidden ring-1 ring-blue-400/30"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {/* Shine effect premium */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                        <Star className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{t('publicCard.reviews.leaveReview')}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Section - Design Premium AWWWARDS LEVEL */}
            <motion.div
              className="mt-8"
              style={{ willChange: 'transform, opacity' }}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.7, 
                delay: 0.5, 
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
            >
              {/* Shadow layers premium */}
              <div className="relative">
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-b from-blue-500/[0.08] via-purple-500/[0.04] to-pink-500/[0.06] rounded-[28px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  whileHover={{ opacity: 1 }}
                />
                <div className="absolute -inset-0.5 bg-gradient-to-b from-black/4 to-black/6 rounded-[26px] blur-md" />

                <div className="relative text-center px-6 py-8 bg-gradient-to-br from-white/98 via-white/95 to-gray-50/60 backdrop-blur-xl rounded-[24px] ring-1 ring-black/[0.03] shadow-xl overflow-hidden">
                  {/* Decorative gradient orbs animés */}
                  <motion.div 
                    className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-violet-500/15 to-pink-500/10 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 2,
                    }}
                  />

                  {/* Inner glow premium */}
                  <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/70 pointer-events-none" />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-purple-50/20 pointer-events-none" />

                  <div className="relative z-10">
                    <motion.p 
                      className="text-[15px] text-gray-700 mb-6 max-w-xs mx-auto leading-relaxed font-medium"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      {t('publicCard.cta.joinBohh')}
                    </motion.p>

                    <Link to="/">
                      <motion.button
                        className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white font-bold text-[15px] shadow-2xl overflow-hidden ring-1 ring-gray-800/50"
                        whileHover={{ scale: 1.06, y: -3 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        {/* Animated shine effect premium */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 1, ease: 'easeInOut' }}
                        />

                        {/* Glow effect multi-couches */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/25 to-pink-600/30 opacity-0 group-hover:opacity-100 blur-2xl"
                          transition={{ duration: 0.6 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

                        <span className="relative z-10 flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            ✨
                          </motion.span>
                          {t('publicCard.cta.createCard')}
                          <motion.svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            viewBox="0 0 24 24"
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </motion.svg>
                        </span>
                      </motion.button>
                    </Link>

                    <p className="mt-6 text-[11px] text-gray-400 font-medium">
                      {t('publicCard.cta.copyright', { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-gray-400 text-[11px]">{t('publicCard.cta.developedBy')}</span>
                      <a
                        href="https://miscoch-it.ga"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 font-semibold text-[11px] hover:text-gray-900 transition-colors"
                      >
                        Miscoch IT
                      </a>
                      <img src="/footer/logo-mit.png" alt="Miscoch IT Logo" className="h-3 w-auto opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
          </CardOrPlain>
        </div>

        {/* Safe area bottom */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      {!fromController && <OSDrawer />}

      {/* Dialogue du formulaire d'avis */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="w-[92vw] sm:w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto glass-card border-2 border-white/30 p-4 sm:p-6 mx-0">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">{t('publicCard.reviews.formTitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('publicCard.reviews.formDescription')}
            </DialogDescription>
          </DialogHeader>

          <ProfessionalReviewForm
            professionalId={id!}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
            isSubmitting={isSubmittingReview}
          />
        </DialogContent>
      </Dialog>

      {/* Modal pour afficher tous les avis - Design cohérent et responsive */}
      <Dialog open={showAllReviews} onOpenChange={setShowAllReviews}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-white p-0 sm:p-6">
          <DialogHeader className="pb-4 sm:pb-6 px-4 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center sm:text-left">
              {t('publicCard.reviews.modalTitle')}
            </DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              {t('publicCard.reviews.modalDescription')}
            </DialogDescription>
            {(() => {
              // Calculer la moyenne à partir des reviews chargées si disponible
              const calculatedAverage = reviews.length > 0
                ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
                : 0;

              // Utiliser la moyenne calculée si card.average_rating est 0/null, sinon utiliser card.average_rating
              const displayRating = (card?.average_rating && card.average_rating > 0)
                ? card.average_rating
                : (calculatedAverage > 0 ? calculatedAverage : 0);

              const displayCount = reviews.length > 0
                ? reviews.length
                : (card?.total_reviews || 0);

              return (displayRating > 0 || displayCount > 0) ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 sm:mb-6">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {displayRating.toFixed(1)}
                  </div>
                  <div className="text-center sm:text-left">
                    <RatingDisplay
                      rating={displayRating}
                      size="md"
                      showCount={false}
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {t('publicCard.reviews.reviewsCount', { count: displayCount })}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
            {isLoadingReviews ? (
              <div className="text-center py-6 sm:py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">{t('publicCard.reviews.loading')}</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <ProfessionalReviewCard
                      review={review}
                      onVote={async (reviewId: string, isHelpful: boolean) => {
                        await handleVote(reviewId, isHelpful);
                      }}
                      onReport={async (reason) => {
                        await handleReport(review.id, reason);
                      }}
                      canVote={true}
                      userVote={null}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 px-4">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">{t('publicCard.reviews.noReviews')}</h3>
                <p className="text-sm text-gray-500 mb-4">{t('publicCard.reviews.noReviewsMessage')}</p>
                <button
                  onClick={() => {
                    setShowAllReviews(false);
                    setShowReviewForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  <Star className="w-4 h-4" />
                  {t('publicCard.reviews.leaveFirstReview')}
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return fromController ? pageContent : (
    <RealityLayerProvider cardId={id ?? null} ownerId={card?.user_id ?? null}>
      {pageContent}
    </RealityLayerProvider>
  );
};

export default PublicCardView;
